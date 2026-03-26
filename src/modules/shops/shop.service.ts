import { Injectable } from '@nestjs/common';
import { PrismaService } from 'db/prisma.service';

@Injectable()
export class ShopService {
  constructor(private prisma: PrismaService) {}

  async isActiveShop(shopId: number): Promise<boolean> {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { is_active: true },
    });
    return shop?.is_active ?? false;
  }
}
