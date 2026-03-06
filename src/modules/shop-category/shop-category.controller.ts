import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/guard/auth.guard";
import { ShopCategoryService } from "./shop-category.service";
import { CreateShopCategoryDto, ShopCategoryWithCategoryDto } from "src/dtos/shop-category.dto";
import { ResponseData, ResponseType } from "src/global/globalResponse";
import { HttpMessage, HttpStatus, Role } from "src/global/globalEnum";
import { GetUser, Roles } from "src/decorators/decorators";

@Controller('shop-categories')
@UseGuards(AuthGuard)
export class ShopCategoryController {
    constructor(
        private readonly shopCategoryService: ShopCategoryService
    ) {}

    @Roles(Role.SHOPOWNER)
    @Post()
    async create(@Body() body: CreateShopCategoryDto, @GetUser('shop_id') shopId: number): Promise<ResponseType<boolean>> {
        return new ResponseData(await this.shopCategoryService.create(body, shopId), HttpStatus.CREATED_SUCCESS, HttpMessage.SUCCESS);
    }

    @Get()
    @Roles(Role.SHOPOWNER)
    async getCategoriesByShopId(@GetUser('shop_id') shopId: number): Promise<ResponseType<ShopCategoryWithCategoryDto[]>> {
        return new ResponseData<ShopCategoryWithCategoryDto[]>(await this.shopCategoryService.getCategoriesByShopId(shopId), HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    }
}