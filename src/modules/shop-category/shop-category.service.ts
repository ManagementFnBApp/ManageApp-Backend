import { Injectable } from "@nestjs/common";
import { PrismaService } from "db/prisma.service";
import { CreateShopCategoryDto, ShopCategoryWithCategoryDto } from "src/dtos/shop-category.dto";

@Injectable()
export class ShopCategoryService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    async create(body: CreateShopCategoryDto, shop_id: number): Promise<boolean> {
        const result = await this.prisma.shopCategory.createMany({
            data: body.category_id.map(categoryId => ({
                shop_id: shop_id,
                category_id: categoryId
            })),
            skipDuplicates: true
        });
        return result.count > 0;
    }

    async getCategoriesByShopId(shopId: number): Promise<ShopCategoryWithCategoryDto[]> {
        const shopCategories = await this.prisma.shopCategory.findMany({
            where: {
                shop_id: shopId
            },
            include: {
                category: true
            }
        })
        return shopCategories;
    }
}