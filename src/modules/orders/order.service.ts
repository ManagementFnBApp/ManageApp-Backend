import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderDto, OrderMonthReportDto, OrderReportDto, OrderResponseDto, ViewOrderDto } from 'src/dtos/oder.dto';
import { OrderStatus } from 'src/global/globalEnum';
import { PrismaService } from 'db/prisma.service';
import { JwtPayloadDto } from 'src/dtos/login.dto';
const POINTS_PER_VND = 10_000;
@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService
  ) { }

  async createOrder(data: OrderDto, _user_id: number): Promise<any> {
    const { order_items, ...orderInfo } = data;

    // 1. Validate that each item has exactly one of product_id or shop_product_id
    for (const item of order_items) {
      const hasProduct = item.product_id != null;
      const hasShopProduct = item.shop_product_id != null;
      if (hasProduct && hasShopProduct) {
        throw new BadRequestException('Each order item must reference either a product or a shop product, not both.');
      }
      if (!hasProduct && !hasShopProduct) {
        throw new BadRequestException('Each order item must reference either a product or a shop product.');
      }
    }

    const productIds = order_items.map((item) => item.product_id).filter((id) => id != null);
    const shopProductIds = order_items.map((item) => item.shop_product_id).filter((id) => id != null);

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

      if (existingProducts.length !== productIds.length || existingShopProducts.length !== shopProductIds.length) {
        throw new BadRequestException('One or more products do not exist');
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
              }
            },
          },
        },
      });
    });

    return {
      id: order.id,
      items: order.order_items.map((item) => ({
        product_name: item.product?.product_name || item.shop_product?.product_name || '',
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
          throw new BadRequestException('Each order item must reference either a product or a shop product, not both.');
        }
        if (!hasProduct && !hasShopProduct) {
          throw new BadRequestException('Each order item must reference either a product or a shop product.');
        }
      }

      // Validate that all products exist
      const productIds = order_items.map((item) => item.product_id).filter((id) => id != null);
      const existingProducts = await prismaTx.product.findMany({
        where: {
          id: { in: productIds },
        },
        select: { id: true },
      });

      const shopProductIds = order_items.map((item) => item.shop_product_id).filter((id) => id != null);
      const existingShopProducts = await prismaTx.shopProduct.findMany({
        where: {
          id: { in: shopProductIds },
        },
        select: { id: true },
      });

      if (existingProducts.length !== productIds.length || existingShopProducts.length !== shopProductIds.length) {
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
        product_name: item.product?.product_name || item.shop_product?.product_name || '',
        quantity: item.quantity,
      })),
    };
  }

  async completeOrder(id: number): Promise<OrderResponseDto> {
    const order = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.orders.update({
        where: { id: Number(id) },
        data: {
          order_status: OrderStatus.COMPLETED,
          completed_at: new Date(),
        },
      });

      // Tích điểm: chỉ khi đơn hàng có customer
      if (updatedOrder.customer_id) {
        const points = Math.floor(Number(updatedOrder.total_amount) / POINTS_PER_VND);
        if (points > 0) {
          await tx.customer.update({
            where: { id: updatedOrder.customer_id },
            data: { loyalty_point: { increment: points } },
          });
        }
      }

      return updatedOrder;
    }, { timeout: 30000, maxWait: 30000 });
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
        product_name: item.product?.product_name || item.shop_product?.product_name || '',
        unit_price: Number(item.unit_price),
      })),
    }));
  }

  async orderReport(dto: OrderMonthReportDto, user: JwtPayloadDto): Promise<OrderReportDto> {
    if (!user.shop_id) {
      throw new BadRequestException('User does not belong to any shop');
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
      }
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
        }
      }
    });

    const dailyMap = new Map<string, { numberOfOrders: number; totalAmount: number }>();
    orders.forEach((order) => {
      const dateStr = order.shift_user.date.toISOString().split('T')[0];
      const current = dailyMap.get(dateStr) || { numberOfOrders: 0, totalAmount: 0 };
      dailyMap.set(dateStr, {
        numberOfOrders: current.numberOfOrders + 1,
        totalAmount: current.totalAmount + Number(order.total_amount),
      });
    });

    // 3. Chạy vòng lặp For để lấp đầy các ngày trong tháng (Fill gaps)
    const report: { date: Date; numberOfOrders: number; totalAmount: number }[] = [];
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
