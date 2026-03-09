import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus } from '@nestjs/common';
import { ShopProductService } from './shop-product.service';
import { CreateShopProductDto, UpdateShopProductDto } from 'src/dtos/shop-product.dto';
import { GetUser, Roles } from 'src/decorators/decorators';
import { HttpMessage, Role } from 'src/global/globalEnum';
import { ResponseData, ResponseType } from 'src/global/globalResponse';

@Controller('shop-product')
export class ShopProductController {
  constructor(private readonly shopProductService: ShopProductService) { }

  @Roles(Role.SHOPOWNER)
  @Post()
  async create(@Body() createShopProductDto: CreateShopProductDto, @GetUser('shop_id') shop_id: number): Promise<ResponseType<any>> {
    if (!shop_id) {
      throw new Error('You are not associated with any shop. Please contact your administrator.');
    }
    return new ResponseData(await this.shopProductService.create(createShopProductDto, shop_id), HttpStatus.CREATED, HttpMessage.SUCCESS);
  }

  @Roles(Role.ADMIN)
  @Get()
  async findAll() {
    return await this.shopProductService.findAll();
  }

  @Roles(Role.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.shopProductService.findOne(+id);
  }

  @Roles(Role.SHOPOWNER, Role.ADMIN)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateShopProductDto: UpdateShopProductDto, @GetUser('shop_id') shop_id: number) {
    return await this.shopProductService.update(+id, updateShopProductDto);
  }

  @Roles(Role.SHOPOWNER, Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.shopProductService.remove(+id);
  }
}
