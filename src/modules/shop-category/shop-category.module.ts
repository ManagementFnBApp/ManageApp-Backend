import { Module } from "@nestjs/common";
import { ShopCategoryService } from "./shop-category.service";
import { PrismaModule } from '../../../db/prisma.module';
import { ShopCategoryController } from "./shop-category.controller";

@Module({
    imports: [PrismaModule],
    controllers: [ShopCategoryController],
    providers: [ShopCategoryService]
})
export class ShopCategoryModule { }