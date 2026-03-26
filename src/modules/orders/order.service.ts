import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  OrderDto,
  OrderMonthReportDto,
  OrderReportDto,
  OrderResponseDto,
  ViewOrderDto,
} from 'src/dtos/oder.dto';
import { OrderStatus } from 'src/global/globalEnum';
import { PrismaService } from 'db/prisma.service';
import { JwtPayloadDto } from 'src/dtos/login.dto';
import { InventoryService } from '../inventories/inventory.service';
import { PayosService, PayosIPN } from '../payos/payos.service';

const POINTS_PER_VND = 10_000;

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly payosService: PayosService,
  ) {}

  async createOrder(data: OrderDto, user: JwtPayloadDto): Promise<any> {
    if (user.shop_id == null || user.shop_id == undefined) {
      throw new BadRequestException('User does not belong to any shop');
    }
    const { order_items, ...orderInfo } = data;

    // 1. Validate that each item has exactly one of product_id or shop_product_id
    for (const item of order_items) {
      const hasProduct = item.product_id != null;
      const hasShopProduct = item.shop_product_id != null;
      if (hasProduct && hasShopProduct) {
        throw new BadRequestException(
          'Each order item must reference either a product or a shop product, not both.',
        );
      }
      if (!hasProduct && !hasShopProduct) {
        throw new BadRequestException(
          'Each order item must reference either a product or a shop product.',
        );
      }
    }

    const productIds = order_items
      .map((item) => item.product_id)
      .filter((id) => id != null);
    const shopProductIds = order_items
      .map((item) => item.shop_product_id)
      .filter((id) => id != null);

    const order = await this.prisma.$transaction(async (prismaTx) => {
      // Kiểm tra sự tồn tại của sản phẩm trong cùng transaction để tránh race condition
      const existingProducts = await prismaTx.product.findMany({
        where: {
          id: { in: productIds },
        },
        select: { id: true },
      });

      const existingShopProducts = await prismaTx.shopProduct.findMany({
        where: {
          id: { in: shopProductIds },
        },
        select: { id: true },
      });

      if (
        existingProducts.length !== productIds.length ||
        existingShopProducts.length !== shopProductIds.length
      ) {
        throw new BadRequestException('One or more products do not exist');
      }

      for (const item of order_items) {
        try {
          await this.inventoryService.decreaseItem({
            product_id: item.product_id,
            shop_product_id: item.shop_product_id,
            quantity: item.quantity,
            shop_id: user.shop_id!,
          });
        } catch (error) {
          throw new BadRequestException(
            'Error processing order: ' + error.message,
          );
        }
      }

      return prismaTx.orders.create({
        data: {
          customer_id: orderInfo.customerId,
          shift_user_id: orderInfo.shiftUserId,
          total_amount: orderInfo.totalAmount,
          order_status: OrderStatus.PENDING,
          notes: orderInfo.note || null,
          completed_at: null,
          cancelled_at: null,
          order_items: {
            create: order_items,
          },
        },
        include: {
          order_items: {
            include: {
              product: {
                select: { product_name: true },
              },
              shop_product: {
                select: { product_name: true },
              },
            },
          },
        },
      });
    });

    return {
      id: order.id,
      items: order.order_items.map((item) => ({
        product_name:
          item.product?.product_name || item.shop_product?.product_name || '',
        quantity: item.quantity,
      })),
    };
  }

  async updateOrder(id: number, data: OrderDto, _userId: number): Promise<any> {
    const { order_items, ...orderInfo } = data;

    const order = await this.prisma.$transaction(async (prismaTx) => {
      const existingOrder = await prismaTx.orders.findUnique({
        where: { id: Number(id) },
      });

      // Validate that each item has exactly one of product_id or shop_product_id
      for (const item of order_items) {
        const hasProduct = item.product_id != null;
        const hasShopProduct = item.shop_product_id != null;
        if (hasProduct && hasShopProduct) {
          throw new BadRequestException(
            'Each order item must reference either a product or a shop product, not both.',
          );
        }
        if (!hasProduct && !hasShopProduct) {
          throw new BadRequestException(
            'Each order item must reference either a product or a shop product.',
          );
        }
      }

      // Validate that all products exist
      const productIds = order_items
        .map((item) => item.product_id)
        .filter((id) => id != null);
      const existingProducts = await prismaTx.product.findMany({
        where: {
          id: { in: productIds },
        },
        select: { id: true },
      });

      const shopProductIds = order_items
        .map((item) => item.shop_product_id)
        .filter((id) => id != null);
      const existingShopProducts = await prismaTx.shopProduct.findMany({
        where: {
          id: { in: shopProductIds },
        },
        select: { id: true },
      });

      if (
        existingProducts.length !== productIds.length ||
        existingShopProducts.length !== shopProductIds.length
      ) {
        throw new BadRequestException('One or more products do not exist');
      }

      // Delete existing order items
      await prismaTx.orderItem.deleteMany({
        where: { order_id: Number(id) },
      });

      // Update order and create new order items
      return prismaTx.orders.update({
        where: { id: Number(id) },
        data: {
          shift_user_id: orderInfo.shiftUserId,
          customer_id: orderInfo.customerId,
          total_amount: orderInfo.totalAmount,
          order_status: OrderStatus.PENDING,
          notes: orderInfo.note || null,
          completed_at: existingOrder?.completed_at || null,
          cancelled_at: existingOrder?.cancelled_at || null,
          order_items: {
            create: order_items,
          },
        },
        include: {
          order_items: {
            include: {
              product: {
                select: { product_name: true },
              },
              shop_product: {
                select: { product_name: true },
              },
            },
          },
        },
      });
    });

    return {
      id: order.id,
      items: order.order_items.map((item) => ({
        product_name:
          item.product?.product_name || item.shop_product?.product_name || '',
        quantity: item.quantity,
      })),
    };
  }

  async completeOrder(id: number): Promise<OrderResponseDto> {
    const order = await this.prisma.$transaction(
      async (tx) => {
        const updatedOrder = await tx.orders.update({
          where: { id: Number(id) },
          data: {
            order_status: OrderStatus.COMPLETED,
            completed_at: new Date(),
          },
        });

        // Tích điểm: chỉ khi đơn hàng có customer
        if (updatedOrder.customer_id) {
          const points = Math.floor(
            Number(updatedOrder.total_amount) / POINTS_PER_VND,
          );
          if (points > 0) {
            await tx.customer.update({
              where: { id: updatedOrder.customer_id },
              data: { loyalty_point: { increment: points } },
            });
          }
        }

        return updatedOrder;
      },
      { timeout: 30000, maxWait: 30000 },
    );
    return this.transformToDto(order);
  }

  async cancelOrder(id: number): Promise<OrderResponseDto> {
    const order = await this.prisma.orders.update({
      where: { id: Number(id) },
      data: {
        order_status: OrderStatus.CANCELLED,
        cancelled_at: new Date(),
      },
    });
    return this.transformToDto(order);
  }

  async getAllOrders(dto: ViewOrderDto, user_id: number): Promise<any[]> {
    // Lấy tất cả shift_user_id thuộc về user này
    const shiftUsers = await this.prisma.shiftUser.findMany({
      where: { user_id },
      select: { id: true },
    });
    const shiftUserIds = shiftUsers.map((su) => su.id);

    const orders = await this.prisma.orders.findMany({
      where: {
        shift_user_id: { in: shiftUserIds },
        ...(dto.status ? { order_status: dto.status } : {}),
      },
      include: {
        order_items: {
          include: {
            product: {
              select: { product_name: true },
            },
            shop_product: {
              select: { product_name: true },
            },
          },
        },
      },
    });
    return orders.map((order) => ({
      ...this.transformToDto(order),
      order_items: order.order_items.map((item) => ({
        ...item,
        product_name:
          item.product?.product_name || item.shop_product?.product_name || '',
        unit_price: Number(item.unit_price),
      })),
    }));
  }

  async orderReport(
    dto: OrderMonthReportDto,
    user: JwtPayloadDto,
  ): Promise<OrderReportDto> {
    if (!user.shop_id) {
      throw new BadRequestException('User does not belong to any shop');
    }
    const exsistingShop = await this.prisma.shop.findUnique({
      where: { id: user.shop_id },
    });
    if (!exsistingShop) {
      throw new BadRequestException('Shop does not exist');
    }

    const startDate = new Date(Date.UTC(dto.year, dto.month - 1, 1));
    const nextMonth = new Date(Date.UTC(dto.year, dto.month, 1));

    const monthlyWhere = {
      shift_user: {
        shop_id: user.shop_id,
        date: {
          gte: startDate,
          lt: nextMonth,
        },
      },
    };

    const numberOfOrders = await this.prisma.orders.count({
      where: {
        ...monthlyWhere,
        order_status: OrderStatus.COMPLETED,
      },
    });

    const orders = await this.prisma.orders.findMany({
      where: {
        ...monthlyWhere,
        order_status: OrderStatus.COMPLETED,
      },
      select: {
        total_amount: true,
        shift_user: {
          select: { date: true },
        },
      },
    });

    const dailyMap = new Map<
      string,
      { numberOfOrders: number; totalAmount: number }
    >();
    orders.forEach((order) => {
      const dateStr = order.shift_user.date.toISOString().split('T')[0];
      const current = dailyMap.get(dateStr) || {
        numberOfOrders: 0,
        totalAmount: 0,
      };
      dailyMap.set(dateStr, {
        numberOfOrders: current.numberOfOrders + 1,
        totalAmount: current.totalAmount + Number(order.total_amount),
      });
    });

    // 3. Chạy vòng lặp For để lấp đầy các ngày trong tháng (Fill gaps)
    const report: {
      date: Date;
      numberOfOrders: number;
      totalAmount: number;
    }[] = [];
    const endDate = new Date(Date.UTC(dto.year, dto.month, 0));
    const daysInMonth = endDate.getUTCDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(Date.UTC(dto.year, dto.month - 1, i));
      const dateKey = dateObj.toISOString().split('T')[0];
      const dailyData = dailyMap.get(dateKey);

      report.push({
        date: dateObj,
        numberOfOrders: dailyData?.numberOfOrders || 0,
        totalAmount: dailyData?.totalAmount || 0,
      });
    }

    return { numberOfOrders, reportByDate: report };
  }

  /**
   * Create an order AND initiate PayOS payment in one flow.
   * 1. Create order (PENDING)
   * 2. Create Payment record (PENDING)
   * 3. Call PayOS with shop's credentials → return checkoutUrl / qrCode
   */
  async createOrderWithPayment(data: OrderDto, user: JwtPayloadDto) {
    if (!user.shop_id) {
      throw new BadRequestException('User does not belong to any shop');
    }

    // 1. Create the order (reuse existing method)
    const orderResult = await this.createOrder(data, user);
    const orderId = orderResult.id;

    // 2. Create Payment record with PENDING status
    const payment = await this.prisma.payment.create({
      data: {
        order_id: orderId,
        amount_paid: data.totalAmount,
        currency: 'VND',
        payment_method: 'PAYOS',
        payment_status: OrderStatus.PENDING,
      },
    });

    // 3. Call PayOS to create payment link using shop's encrypted credentials
    try {
      const { orderCode, payosResponse } =
        await this.payosService.createOrderPayment(user.shop_id, data, orderId);

      this.logger.log(
        `PayOS payment created for order ${orderId}, payment ${payment.id}`,
      );

      const payosCode = String(
        payosResponse.code ?? payosResponse.statusCode ?? '',
      );
      if (payosCode !== '00') {
        const detail =
          payosResponse.desc ??
          payosResponse.message ??
          payosResponse.error ??
          'Unknown';
        throw new Error(`PayOS rejected create-payment: ${detail}`);
      }

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { payos_order_code: orderCode },
      });

      return {
        orderId,
        paymentId: payment.id,
        items: orderResult.items,
        checkoutUrl: payosResponse.data?.checkoutUrl || null,
        qrCode: payosResponse.data?.qrCode || null,
      };
    } catch (error) {
      // Rollback: mark payment as cancelled if PayOS call fails
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { payment_status: OrderStatus.CANCELLED },
      });
      throw new BadRequestException(
        `Failed to create PayOS payment: ${error.message}`,
      );
    }
  }

  /**
   * Handle PayOS webhook for order payments.
   * Verifies signature, then updates Payment + Order status.
   */
  async handlePayosOrderWebhook(webhookData: PayosIPN) {
    if (!webhookData.data) {
      this.logger.warn('Webhook received with no data payload');
      return { message: 'No data' };
    }

    const { orderCode, status, signature } = webhookData.data;

    if (!signature) {
      throw new BadRequestException('Missing webhook signature');
    }

    // Find the payment by reconstructing the orderCode → order_id relationship
    // orderCode format: `${shopId}${orderId}` or fallback timestamp-based
    // We look up by finding a PENDING PAYOS payment whose order matches
    const payment = await this.prisma.payment.findMany({
      where: {
        payment_method: 'PAYOS',
        payos_order_code: String(orderCode),
      },
      include: {
        order: {
          include: {
            shift_user: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    if (payment.length === 0) {
      return { message: 'Payment not found' };
    }

    // Match by orderCode: try shopId + orderId combination
    let matchedPayment: {
      id: number;
      order_id: number;
      shopId: number;
    } | null = null;
    for (const p of payment) {
      const shopId = p.order.shift_user?.shop_id;
      if (!shopId) continue;

      const expectedCode = Number(`${shopId}${p.order_id}`);
      if (expectedCode === orderCode) {
        matchedPayment = { ...p, shopId };
        break;
      }
    }

    if (!matchedPayment) {
      this.logger.warn(
        `No matching pending payment for orderCode ${orderCode}`,
      );
      return { message: 'Payment not found' };
    }

    // Verify signature using shop's checksumKey
    if (signature) {
      const { signature: _sig, ...dataWithoutSig } = webhookData.data;
      const isValid = await this.payosService.verifyShopWebhookSignature(
        dataWithoutSig,
        signature,
        matchedPayment.shopId,
      );

      if (!isValid) {
        this.logger.warn(
          `Invalid webhook signature for orderCode ${orderCode}`,
        );
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    // Update based on status
    if (status === 'PAID') {
      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: matchedPayment.id },
          data: { payment_status: OrderStatus.PAID },
        }),
        this.prisma.orders.update({
          where: { id: matchedPayment.order_id },
          data: { order_status: OrderStatus.PAID },
        }),
      ]);

      this.logger.log(
        `Order ${matchedPayment.order_id} payment confirmed (PAID) via webhook`,
      );
      return { message: 'Payment confirmed', orderId: matchedPayment.order_id };
    }

    if (status === 'CANCELLED') {
      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: matchedPayment.id },
          data: { payment_status: OrderStatus.CANCELLED },
        }),
        this.prisma.orders.update({
          where: { id: matchedPayment.order_id },
          data: {
            order_status: OrderStatus.CANCELLED,
            cancelled_at: new Date(),
          },
        }),
      ]);

      this.logger.log(
        `Order ${matchedPayment.order_id} payment cancelled via webhook`,
      );
      return { message: 'Payment cancelled', orderId: matchedPayment.order_id };
    }

    return { message: `Unhandled status: ${status}` };
  }

  transformToDto(order: any): OrderResponseDto {
    return {
      id: order.id,
      customerId: order.customer_id,
      shiftUserId: order.shift_user_id,
      note: order.notes || null,
      totalAmount: Number(order.total_amount),
      orderStatus: order.order_status,
      createdAt: order.created_at?.toISOString() || null,
      completedAt: order.completed_at || null,
      cancelledAt: order.cancelled_at || null,
    };
  }
}
