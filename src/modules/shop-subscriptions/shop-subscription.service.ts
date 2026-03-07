import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateSubscriptionPaymentDto,
  SubscriptionPaymentResponseDto,
  CreateSubscriptionShopDto,
  SubscriptionShopResponseDto,
} from '../../dtos/subscription.dto';
import { RoleService } from '../roles/role.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from 'db/prisma.service';

@Injectable()
export class ShopSubscriptionService {
  constructor(
    private prisma: PrismaService,
    private roleService: RoleService,
    private emailService: EmailService,
  ) {}

  // ==================== SHOP SUBSCRIPTION METHODS ====================

  async createSubscriptionShop(
    dto: CreateSubscriptionShopDto,
    userId: number,
  ): Promise<SubscriptionShopResponseDto> {
    // Kiểm tra subscription có tồn tại không
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: dto.subscription_id },
    });

    if (!subscription) {
      throw new BadRequestException(
        `Subscription ID ${dto.subscription_id} không tồn tại`,
      );
    }

    // Kiểm tra user có tồn tại không
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException(`User ID ${userId} không tồn tại`);
    }

    // VALIDATE: Kiểm tra xem user đã có shop subscription nào đang active không
    const existingActiveShop = await this.prisma.shopSubscription.findFirst({
      where: {
        shop: {
          users: {
            some: {
              id: userId,
            },
          },
        },
        is_expired: false,
      },
    });

    if (existingActiveShop) {
      throw new BadRequestException(
        `Bạn đã có shop subscription đang active. Mỗi user chỉ được có 1 shop subscription active. Sub Shop ID của bạn: ${existingActiveShop.id}`,
      );
    }

    // VALIDATE: Kiểm tra xem user có shop subscription đã expired nhưng chưa bị xóa không
    // (Trong vòng 14 ngày sau khi expired, không cho tạo shop mới)
    const existingExpiredShop = await this.prisma.shopSubscription.findFirst({
      where: {
        shop: {
          users: {
            some: {
              id: userId,
            },
          },
          is_active: true, // Chỉ check shop còn active (chưa bị soft delete)
        },
        is_expired: true,
      },
      include: {
        shop: true,
      },
    });

    if (existingExpiredShop) {
      // Tính số ngày đã expired
      const now = new Date();
      const endDate = new Date(existingExpiredShop.end_date || new Date());
      const daysExpired = Math.floor(
        (now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      throw new BadRequestException(
        `Bạn không thể đăng ký shop mới vì đang có shop "${existingExpiredShop.shop.shop_name}" (ID: ${existingExpiredShop.shop_id}) đã hết hạn ${daysExpired} ngày trước. ` +
          `Shop này sẽ bị vô hiệu hóa vĩnh viễn sau ${14 - daysExpired} ngày. ` +
          `Vui lòng gia hạn shop hiện tại hoặc chờ đến khi shop bị vô hiệu hóa để đăng ký shop mới.`,
      );
    }

    // Tạo shop trước với is_active = false (sẽ được set true khi payment success)
    const shop = await this.prisma.shop.create({
      data: {
        shop_name: dto.shop_name, // Sử dụng tên shop user nhập
        is_active: false, // Chưa thanh toán
      },
    });

    // GÁN SHOP_ID CHO USER NGAY (dù shop chưa active)
    // Điều này giúp tìm được user khi payment success
    await this.prisma.user.update({
      where: { id: userId },
      data: { shop_id: shop.id },
    });

    // Tính toán thời hạn dựa vào billing_cycle của subscription
    const startDate = new Date();
    const endDate = this.calculateEndDate(
      subscription.billing_cycle,
      startDate,
    );

    const shopSubscription = await this.prisma.shopSubscription.create({
      data: {
        subscription_id: dto.subscription_id,
        shop_id: shop.id,
        number_of_renewals: 0,
        start_date: startDate,
        end_date: endDate,
        is_expired: false,
      },
      include: {
        subscription: true, // Include để trả về thông tin price cho user
      },
    });

    return this.transformShopSubscriptionToDto(shopSubscription);
  }

  // ==================== MAINTENANCE METHODS (for CronJob) ====================

  async checkAndUpdateExpiredSubscriptions(): Promise<{
    updated: number;
    message: string;
  }> {
    // Tìm tất cả shop subscription đã hết hạn nhưng chưa được đánh dấu
    const expiredShops = await this.prisma.shopSubscription.findMany({
      where: {
        is_expired: false,
        end_date: {
          lte: new Date(), // end_date <= now
        },
      },
      include: {
        shop: {
          include: {
            users: true,
          },
        },
        subscription: true,
      },
    });

    // Update tất cả các shop đã hết hạn và gửi notification
    if (expiredShops.length > 0) {
      await this.prisma.shopSubscription.updateMany({
        where: {
          id: {
            in: expiredShops.map((s) => s.id),
          },
        },
        data: {
          is_expired: true,
        },
      });

      // Gửi notification cho SHOPOWNER của mỗi shop
      for (const shopSub of expiredShops) {
        // Tìm SHOPOWNER gốc (owner_manager_id = null)
        const shopOwner = shopSub.shop.users.find(
          (u) => u.owner_manager_id === null && u.shop_id === shopSub.shop_id,
        );

        if (shopOwner) {
          // Gửi email thực sự
          try {
            await this.emailService.sendSubscriptionExpiredNotification(
              shopOwner.email,
              shopSub.shop.shop_name,
              shopSub.subscription.package_code,
              shopSub.end_date || new Date(),
            );
          } catch (error) {
            // Không throw error để tiếp tục gửi cho các shop khác
          }
        }
      }
    }

    return {
      updated: expiredShops.length,
      message: `Đã cập nhật ${expiredShops.length} shop subscription đã hết hạn và gửi thông báo cho SHOPOWNER`,
    };
  }

  async deleteUnpaidShops(): Promise<{ deleted: number; message: string }> {
    // Tìm các shop subscription được tạo hơn 1 giờ trước và chưa có payment success
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Tìm các shop subscription có shop is_active = false và được tạo hơn 1 giờ trước
    const unpaidShopSubscriptions = await this.prisma.shopSubscription.findMany(
      {
        where: {
          created_at: {
            lte: oneHourAgo, // created_at <= 1 hour ago
          },
          shop: {
            is_active: false, // Shop chưa được kích hoạt
          },
        },
        include: {
          subscription_payments: true,
          shop: true,
        },
      },
    );

    // Filter ra các shop không có payment success
    const shopsToDelete = unpaidShopSubscriptions.filter(
      (shopSub) =>
        !shopSub.subscription_payments.some(
          (payment) => payment.payment_status === 'success',
        ),
    );

    let deletedCount = 0;

    // Xóa từng shop và shop subscription
    for (const shopSub of shopsToDelete) {
      try {
        // 1. Xóa các payment liên quan (nếu có)
        await this.prisma.subscriptionPayment.deleteMany({
          where: { sub_shop_id: shopSub.id },
        });

        // 2. Xóa shop subscription
        await this.prisma.shopSubscription.delete({
          where: { id: shopSub.id },
        });

        // 3. Xóa shop
        await this.prisma.shop.delete({
          where: { id: shopSub.shop_id },
        });

        deletedCount++;
      } catch (error) {
        // Log lỗi nhưng tiếp tục xóa các shop khác
      }
    }

    return {
      deleted: deletedCount,
      message: `Đã xóa ${deletedCount} shop chưa thanh toán sau 1 giờ`,
    };
  }

  async deleteExpiredShopsAfter14Days(): Promise<{
    deleted: number;
    message: string;
  }> {
    // Tìm các shop subscription đã expired hơn 14 ngày
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const expiredShopSubscriptions =
      await this.prisma.shopSubscription.findMany({
        where: {
          is_expired: true,
          end_date: {
            lte: fourteenDaysAgo, // end_date <= 14 days ago
          },
        },
        include: {
          shop: {
            include: {
              users: true, // Lấy tất cả users trong shop
            },
          },
          subscription_payments: true,
        },
      });

    let deletedCount = 0;

    for (const shopSub of expiredShopSubscriptions) {
      try {
        const shopId = shopSub.shop_id;
        const shop = shopSub.shop;

        // Tìm SHOPOWNER gốc của shop này
        const shopOwner = shop.users.find(
          (u) => u.owner_manager_id === null && u.shop_id === shopId,
        );

        // 1. Xóa tất cả users có owner_manager_id trùng với SHOPOWNER (STAFF)
        if (shopOwner) {
          const staffUsers = await this.prisma.user.findMany({
            where: {
              owner_manager_id: shopOwner.id,
            },
          });

          for (const staff of staffUsers) {
            // Xóa profile của staff (nếu có)
            await this.prisma.profile.deleteMany({
              where: { user_id: staff.id },
            });

            // Xóa staff user
            await this.prisma.user.delete({
              where: { id: staff.id },
            });
          }
        }

        // 2. GIỮ LẠI subscription_payments và shop_subscription
        // Không xóa để còn tính doanh thu và audit trail

        // 3. Xóa các dữ liệu liên quan đến shop
        // - Xóa shift_users của shop
        await this.prisma.shiftUser.deleteMany({
          where: { shop_id: shopId },
        });

        // - Xóa order_items và payments của orders
        const orders = await this.prisma.orders.findMany({
          where: { user: { shop_id: shopId } },
        });
        for (const order of orders) {
          await this.prisma.orderItem.deleteMany({
            where: { order_id: order.id },
          });
          await this.prisma.payment.deleteMany({
            where: { order_id: order.id },
          });
        }

        // - Xóa orders
        await this.prisma.orders.deleteMany({
          where: { user: { shop_id: shopId } },
        });

        // - Xóa shifts (chỉ có shift_users, shift templates là global)

        // - Xóa merchandise redemptions
        await this.prisma.merchandiseRedemption.deleteMany({
          where: { shop_id: shopId },
        });

        // - Xóa merchandises
        await this.prisma.merchandise.deleteMany({
          where: { shop_id: shopId },
        });

        // - Xóa inventory traits
        const inventoryItems = await this.prisma.inventoryItem.findMany({
          where: { inventory: { shop_id: shopId } },
        });
        for (const item of inventoryItems) {
          await this.prisma.inventoryTrait.deleteMany({
            where: { inventory_item_id: item.id },
          });
        }

        // - Xóa inventory items
        await this.prisma.inventoryItem.deleteMany({
          where: { inventory: { shop_id: shopId } },
        });

        // - Xóa inventories
        await this.prisma.inventory.deleteMany({
          where: { shop_id: shopId },
        });

        // - Xóa shop categories
        await this.prisma.shopCategory.deleteMany({
          where: { shop_id: shopId },
        });

        // - Xóa customers
        await this.prisma.customer.deleteMany({
          where: { shop_id: shopId },
        });

        // 5. Reset SHOPOWNER về trạng thái ban đầu (không có shop, không có role SHOPOWNER)
        if (shopOwner) {
          // Tìm role USER hoặc set về null
          let defaultRoleId: number | null = null;
          try {
            const userRole = await this.roleService.getRoleByCode('USER');
            if (userRole && userRole.role_id) {
              defaultRoleId = userRole.role_id;
            }
          } catch (error) {
            // Không có role USER, set null
          }

          await this.prisma.user.update({
            where: { id: shopOwner.id },
            data: {
              shop_id: null,
              role_id: defaultRoleId,
              owner_manager_id: null,
            },
          });
        }

        // 6. Soft delete shop (set is_active = false) thay vì xóa thật
        // Giữ lại để không vi phạm foreign key với shop_subscription và payments
        await this.prisma.shop.update({
          where: { id: shopId },
          data: {
            is_active: false,
            shop_name: `[DELETED] ${shop.shop_name}`, // Đánh dấu đã xóa
          },
        });

        deletedCount++;
      } catch (error) {}
    }

    return {
      deleted: deletedCount,
      message: `Đã xóa ${deletedCount} shop đã expired hơn 14 ngày (soft delete, giữ lại payments và subscription cho mục đích tính doanh thu)`,
    };
  }

  // ==================== SUBSCRIPTION PAYMENT METHODS ====================

  async createSubscriptionPayment(
    dto: CreateSubscriptionPaymentDto,
    userId: number,
  ): Promise<SubscriptionPaymentResponseDto> {
    // Kiểm tra shop subscription có tồn tại không
    const shopSubscription = await this.prisma.shopSubscription.findUnique({
      where: { id: dto.sub_shop_id },
      include: {
        shop: true,
        subscription: true, // Include subscription để validate price
      },
    });

    if (!shopSubscription) {
      throw new BadRequestException(
        `Shop subscription ID ${dto.sub_shop_id} không tồn tại`,
      );
    }

    // VALIDATE: Kiểm tra amount phải bằng với price của subscription
    const subscriptionPrice = parseFloat(
      shopSubscription.subscription.price.toString(),
    );
    if (dto.amount !== subscriptionPrice) {
      throw new BadRequestException(
        `Số tiền thanh toán không đúng. Amount phải bằng ${subscriptionPrice} (giá gói ${shopSubscription.subscription.package_code}).`,
      );
    }

    // Kiểm tra user có tồn tại không
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException(`User ID ${userId} không tồn tại`);
    }

    // VALIDATE: Kiểm tra xem đã có payment thành công cho shop subscription này chưa
    const existingSuccessPayment =
      await this.prisma.subscriptionPayment.findFirst({
        where: {
          sub_shop_id: dto.sub_shop_id,
          payment_status: 'success',
        },
      });

    // Nếu đã có payment thành công, không cho tạo payment mới
    if (existingSuccessPayment) {
      throw new BadRequestException(
        `Shop subscription này đã được kích hoạt. Không thể tạo payment mới.`,
      );
    }

    // Tạo payment record với status mặc định là 'pending'
    const payment = await this.prisma.subscriptionPayment.create({
      data: {
        sub_shop_id: dto.sub_shop_id,
        method: dto.method,
        amount: dto.amount,
        payment_status: 'pending', // Luôn tự động là pending khi tạo mới
      },
      include: {
        shop_subscription: {
          include: {
            shop: true,
          },
        },
      },
    });

    // Payment mới tạo luôn là 'pending', không tự động assign shop/role
    // Chỉ khi update status thành 'success' thì mới assign

    return this.transformPaymentToDto(payment, user);
  }

  async updateSubscriptionPaymentStatus(
    paymentId: number,
  ): Promise<SubscriptionPaymentResponseDto> {
    // Kiểm tra payment có tồn tại không
    const payment = await this.prisma.subscriptionPayment.findUnique({
      where: { id: paymentId },
      include: {
        shop_subscription: {
          include: {
            shop: true,
            subscription: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ID ${paymentId} không tồn tại`);
    }

    // Kiểm tra payment có đang ở trạng thái pending không
    if (payment.payment_status !== 'pending') {
      throw new BadRequestException(
        `Payment này đã được xử lý với status: ${payment.payment_status}. Chỉ có thể confirm payment có status là 'pending'.`,
      );
    }

    // Tự động update payment status thành 'success'
    const updatedPayment = await this.prisma.subscriptionPayment.update({
      where: { id: paymentId },
      data: { payment_status: 'success' },
      include: {
        shop_subscription: {
          include: {
            shop: true,
          },
        },
      },
    });

    // Xử lý logic khi payment success
    await this.processSuccessfulPayment(paymentId);

    return this.transformPaymentToDto(updatedPayment, null);
  }

  async renewSubscription(
    dto: any,
    userId: number,
  ): Promise<SubscriptionPaymentResponseDto> {
    // Lấy user để biết shop_id
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new BadRequestException(`User ID ${userId} không tồn tại`);
    }

    if (!user.shop_id) {
      throw new BadRequestException(
        `User chưa có shop. Không thể renew subscription.`,
      );
    }

    // VALIDATE: Chỉ SHOPOWNER mới được renew
    if (user.role?.role_code !== 'SHOPOWNER') {
      throw new BadRequestException(
        `Chỉ SHOPOWNER mới có quyền gia hạn subscription.`,
      );
    }

    // Lấy shop subscription hiện tại của shop
    const shopSubscription = await this.prisma.shopSubscription.findFirst({
      where: {
        shop_id: user.shop_id,
      },
      orderBy: {
        created_at: 'desc', // Lấy subscription mới nhất
      },
      include: {
        subscription: true,
      },
    });

    if (!shopSubscription) {
      throw new NotFoundException(
        `Không tìm thấy subscription cho shop ID ${user.shop_id}`,
      );
    }

    // Kiểm tra xem đã có payment pending cho subscription này chưa
    const existingPendingPayment =
      await this.prisma.subscriptionPayment.findFirst({
        where: {
          sub_shop_id: shopSubscription.id,
          payment_status: 'pending',
        },
      });

    if (existingPendingPayment) {
      throw new BadRequestException(
        `Đã có payment đang chờ xử lý (Payment ID: ${existingPendingPayment.id}). Vui lòng hoàn tất payment này trước khi tạo renew mới.`,
      );
    }

    // Lấy giá từ subscription package
    const amount = parseFloat(shopSubscription.subscription.price.toString());

    // Tạo payment record với status 'pending' cho việc renew
    const payment = await this.prisma.subscriptionPayment.create({
      data: {
        sub_shop_id: shopSubscription.id,
        method: dto.method,
        amount: amount,
        payment_status: 'pending',
      },
      include: {
        shop_subscription: {
          include: {
            shop: true,
            subscription: true,
          },
        },
      },
    });

    return this.transformPaymentToDto(payment, user);
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private async processSuccessfulPayment(paymentId: number): Promise<void> {
    // Lấy payment details
    const payment = await this.prisma.subscriptionPayment.findUnique({
      where: { id: paymentId },
      include: {
        shop_subscription: {
          include: {
            shop: true,
            subscription: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ID ${paymentId} không tồn tại`);
    }

    const shopSubscription = payment.shop_subscription;
    const shop = shopSubscription.shop;

    // Kiểm tra xem shop đã active chưa (để phân biệt subscription đầu tiên hay renew)
    const isFirstPayment = !shop.is_active;

    if (isFirstPayment) {
      // === TRƯỜNG HỢP 1: SUBSCRIPTION ĐẦU TIÊN ===
      // Tìm user dựa trên shop
      const users = await this.prisma.user.findMany({
        where: { shop_id: shop.id },
      });

      if (users.length === 0) {
        throw new BadRequestException(
          `Không tìm thấy user nào cho shop ID ${shop.id}`,
        );
      }

      const user = users[0];

      // 1. Lấy hoặc tạo role SHOPOWNER
      let shopOwnerRole;
      try {
        shopOwnerRole = await this.roleService.getRoleByCode('SHOPOWNER');
      } catch (error) {
        // Nếu role chưa tồn tại, tạo mới
        shopOwnerRole = await this.roleService.createRole({
          role_code: 'SHOPOWNER',
          description: 'Shop Owner - Quản lý cửa hàng',
          permissions: null,
        });
      }

      // 2. Update user với shop_id và role_id
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          shop_id: shop.id,
          role_id: shopOwnerRole.role_id,
          owner_manager_id: null, // Là SHOPOWNER gốc
        },
      });

      // 3. Set shop is_active = true vì đã thanh toán thành công
      await this.prisma.shop.update({
        where: { id: shop.id },
        data: { is_active: true },
      });
    } else {
      // === TRƯỜNG HỢP 2: RENEW SUBSCRIPTION ===
      // 1. Tăng number_of_renewals
      await this.prisma.shopSubscription.update({
        where: { id: shopSubscription.id },
        data: {
          number_of_renewals: (shopSubscription.number_of_renewals || 0) + 1,
        },
      });

      // 2. Tính toán end_date mới dựa vào billing_cycle
      const currentEndDate = shopSubscription.end_date || new Date();
      const newEndDate = this.calculateEndDate(
        shopSubscription.subscription.billing_cycle,
        currentEndDate,
      );

      // 3. Update end_date và set is_expired = false
      await this.prisma.shopSubscription.update({
        where: { id: shopSubscription.id },
        data: {
          end_date: newEndDate,
          is_expired: false,
        },
      });

      // 4. Đảm bảo shop vẫn active
      await this.prisma.shop.update({
        where: { id: shop.id },
        data: { is_active: true },
      });
    }
  }

  // Helper: Tính toán end_date dựa vào billing_cycle
  private calculateEndDate(
    billingCycle: string,
    startDate: Date = new Date(),
  ): Date {
    const endDate = new Date(startDate);

    switch (billingCycle.toUpperCase()) {
      case 'MONTHLY':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'YEARLY':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case 'WEEKLY':
        endDate.setDate(endDate.getDate() + 7);
        break;
      default:
        // Default to 30 days if unknown billing cycle
        endDate.setDate(endDate.getDate() + 30);
    }

    return endDate;
  }

  // Transform helpers
  private transformShopSubscriptionToDto(
    shopSub: any,
  ): SubscriptionShopResponseDto {
    return {
      sub_shop_id: shopSub.id,
      subscription_id: shopSub.subscription_id,
      shop_id: shopSub.shop_id,
      number_of_renewals: shopSub.number_of_renewals,
      start_date: shopSub.start_date,
      end_date: shopSub.end_date,
      created_at: shopSub.created_at,
      updated_at: shopSub.updated_at,
      is_expired: shopSub.is_expired,
      subscription: shopSub.subscription
        ? {
            package_code: shopSub.subscription.package_code,
            price: parseFloat(shopSub.subscription.price),
            billing_cycle: shopSub.subscription.billing_cycle,
          }
        : undefined,
    };
  }

  private transformPaymentToDto(
    payment: any,
    user: any,
  ): SubscriptionPaymentResponseDto {
    return {
      sub_payment_id: payment.id,
      sub_shop_id: payment.sub_shop_id,
      method: payment.method,
      amount: parseFloat(payment.amount),
      created_at: payment.created_at,
      payment_status: payment.payment_status,
      shop: payment.shop_subscription?.shop
        ? {
            shop_id: payment.shop_subscription.shop.id,
            shop_name: payment.shop_subscription.shop.shop_name,
          }
        : undefined,
      user: user
        ? {
            user_id: user.id,
            username: user.username,
            role: user.role?.role_code || null,
          }
        : undefined,
    };
  }
}
