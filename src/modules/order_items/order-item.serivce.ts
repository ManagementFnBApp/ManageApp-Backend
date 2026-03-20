import { Injectable } from '@nestjs/common';
import { PrismaService } from 'db/prisma.service';

@Injectable()
export class OrderItemService {
  constructor(private prisma: PrismaService) {}

  async findByOrderId(orderId: number) {
    return this.prisma.orderItem.findMany({
      where: { order_id: orderId },
      include: {
        product: true,
        shop_product: true,
      },
    });
  }
}
