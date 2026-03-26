import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'db/prisma.service';
import { JwtPayloadDto } from 'src/dtos/login.dto';
import {
  CreateShopCategoryDto,
  ShopCategoryWithCategoryDto,
} from 'src/dtos/shop-category.dto';

@Injectable()
export class ShopCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreateShopCategoryDto, shop_id: number): Promise<boolean> {
    const result = await this.prisma.shopCategory.createMany({
      data: body.category_id.map((categoryId) => ({
        shop_id: shop_id,
        category_id: categoryId,
      })),
      skipDuplicates: true,
    });
    return result.count > 0;
  }

  async getCategoriesByShopId(
    shopId: number,
  ): Promise<ShopCategoryWithCategoryDto[]> {
    const shopCategories = await this.prisma.shopCategory.findMany({
      where: {
        shop_id: shopId,
      },
      include: {
        category: true,
      },
    });
    return shopCategories;
  }

  async delete(user: JwtPayloadDto, categoryId: number): Promise<boolean> {
    if(user.shop_id === null) {
      throw new UnauthorizedException('User does not belong to any shop');
    }
    const result = await this.prisma.shopCategory.deleteMany({
      where: {
        shop_id: user.shop_id,
        category_id: categoryId,
      },
    });
    return result.count > 0;
  }
}
