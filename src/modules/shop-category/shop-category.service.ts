import { Injectable } from "@nestjs/common";
import { PrismaService } from "db/prisma.service";
import { ShopCategoryDto } from "src/dtos/shop-category.dto";

@Injectable()
export class ShopCategoryService {
    constructor(
        private  readonly prisma: PrismaService
    ) {}

    async create(body: ShopCategoryDto): Promise<ShopCategoryDto> {
        const shopCategory = await this.prisma.shopCategory.create({
            data: {
                shop_id: body.shop_id,
                category_id: body.category_id
            }
        })
        return shopCategory;
    }
}