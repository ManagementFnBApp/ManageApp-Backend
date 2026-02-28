import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateSubscriptionPaymentDto,
  SubscriptionPaymentResponseDto,
  CreateSubscriptionShopDto,
  SubscriptionShopResponseDto,
} from '../../dtos/subscription.dto';
import { RoleService } from '../roles/role.service';

@Injectable()
export class ShopSubscriptionService {
  constructor(
    private prisma: PrismaService,
    private roleService: RoleService,
  ) {}

  // ==================== SHOP SUBSCRIPTION METHODS ====================

  async createSubscriptionShop(dto: CreateSubscriptionShopDto, userId: number): Promise<SubscriptionShopResponseDto> {
    // Kiểm tra subscription có tồn tại không
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: dto.subscription_id },
    });

    if (!subscription) {
      throw new BadRequestException(`Subscription ID ${dto.subscription_id} không tồn tại`);
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
        `Bạn đã có shop subscription đang active. Mỗi user chỉ được có 1 shop subscription active. Sub Shop ID của bạn: ${existingActiveShop.id}`
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
    const endDate = this.calculateEndDate(subscription.billing_cycle, startDate);

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

  async checkAndUpdateExpiredSubscriptions(): Promise<{ updated: number; message: string }> {
    // Tìm tất cả shop subscription đã hết hạn nhưng chưa được đánh dấu
    const expiredShops = await this.prisma.shopSubscription.findMany({
      where: {
        is_expired: false,
        end_date: {
          lte: new Date(), // end_date <= now
        },
      },
    });

    // Update tất cả các shop đã hết hạn
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
    }

    return {
      updated: expiredShops.length,
      message: `Đã cập nhật ${expiredShops.length} shop subscription đã hết hạn`,
    };
  }

  async deleteUnpaidShops(): Promise<{ deleted: number; message: string }> {
    // Tìm các shop subscription được tạo hơn 1 giờ trước và chưa có payment success
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Tìm các shop subscription có shop is_active = false và được tạo hơn 1 giờ trước
    const unpaidShopSubscriptions = await this.prisma.shopSubscription.findMany({
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
    });

    // Filter ra các shop không có payment success
    const shopsToDelete = unpaidShopSubscriptions.filter(
      (shopSub) => !shopSub.subscription_payments.some(
        (payment) => payment.payment_status === 'success'
      )
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
        console.error(`Lỗi khi xóa shop ${shopSub.shop_id}:`, error);
      }
    }

    return {
      deleted: deletedCount,
      message: `Đã xóa ${deletedCount} shop chưa thanh toán sau 1 giờ`,
    };
  }

  // ==================== SUBSCRIPTION PAYMENT METHODS ====================

  async createSubscriptionPayment(dto: CreateSubscriptionPaymentDto, userId: number): Promise<SubscriptionPaymentResponseDto> {
    // Kiểm tra shop subscription có tồn tại không
    const shopSubscription = await this.prisma.shopSubscription.findUnique({
      where: { id: dto.sub_shop_id },
      include: {
        shop: true,
        subscription: true, // Include subscription để validate price
      },
    });

    if (!shopSubscription) {
      throw new BadRequestException(`Shop subscription ID ${dto.sub_shop_id} không tồn tại`);
    }

    // VALIDATE: Kiểm tra amount phải bằng với price của subscription
    const subscriptionPrice = parseFloat(shopSubscription.subscription.price.toString());
    if (dto.amount !== subscriptionPrice) {
      throw new BadRequestException(
        `Số tiền thanh toán không đúng. Amount phải bằng ${subscriptionPrice} (giá gói ${shopSubscription.subscription.package_code}).`
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
    const existingSuccessPayment = await this.prisma.subscriptionPayment.findFirst({
      where: {
        sub_shop_id: dto.sub_shop_id,
        payment_status: 'success',
      },
    });

    // Nếu đã có payment thành công, không cho tạo payment mới
    if (existingSuccessPayment) {
      throw new BadRequestException(
        `Shop subscription này đã được kích hoạt. Không thể tạo payment mới.`
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
        `Payment này đã được xử lý với status: ${payment.payment_status}. Chỉ có thể confirm payment có status là 'pending'.`
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

    // Xử lý logic assign shop và role khi payment success
    // Tìm user dựa trên shop
    const users = await this.prisma.user.findMany({
      where: { shop_id: payment.shop_subscription.shop_id },
    });

    if (users.length > 0) {
      await this.processSuccessfulPayment(paymentId, users[0].id);
    }

    return this.transformPaymentToDto(updatedPayment, null);
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private async processSuccessfulPayment(paymentId: number, userId: number): Promise<void> {
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

    // Lấy user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new BadRequestException(`User ID ${userId} không tồn tại`);
    }

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
      where: { id: userId },
      data: {
        shop_id: payment.shop_subscription.shop_id,
        role_id: shopOwnerRole.role_id,
        owner_manager_id: null, // Là SHOPOWNER gốc
      },
    });

    // 3. Set shop is_active = true vì đã thanh toán thành công
    await this.prisma.shop.update({
      where: { id: payment.shop_subscription.shop_id },
      data: { is_active: true },
    });
  }

  // Helper: Tính toán end_date dựa vào billing_cycle
  private calculateEndDate(billingCycle: string, startDate: Date = new Date()): Date {
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
  private transformShopSubscriptionToDto(shopSub: any): SubscriptionShopResponseDto {
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

  private transformPaymentToDto(payment: any, user: any): SubscriptionPaymentResponseDto {
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
