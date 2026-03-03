import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/guard/auth.guard";
import { ShopCategoryService } from "./shop-category.service";
import { ShopCategoryDto } from "src/dtos/shop-category.dto";
import { ResponseData, ResponseType } from "src/global/globalResponse";
import { HttpMessage, HttpStatus, Role } from "src/global/globalEnum";
import { Roles } from "src/decorators/decorators";

@Controller('shop-categories')
@UseGuards(AuthGuard)
export class ShopCategoryController {
    constructor(
        private readonly shopCategoryService: ShopCategoryService
    ) {}

    @Roles(Role.SHOPOWNER)
    @Post()
    async create(@Body() body: ShopCategoryDto): Promise<ResponseType<ShopCategoryDto>> {
        return new ResponseData(await this.shopCategoryService.create(body), HttpStatus.CREATED_SUCCESS, HttpMessage.SUCCESS);
    }
}