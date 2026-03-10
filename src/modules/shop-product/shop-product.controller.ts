import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, ForbiddenException } from '@nestjs/common';
import { ShopProductService } from './shop-product.service';
import { CreateShopProductDto, ShopProductResponseDto, UpdateShopProductDto } from 'src/dtos/shop-product.dto';
import { GetUser, Roles } from 'src/decorators/decorators';
import { HttpMessage, Role } from 'src/global/globalEnum';
import { ResponseData, ResponseType } from 'src/global/globalResponse';

@Controller('shop-products')
export class ShopProductController {
  constructor(private readonly shopProductService: ShopProductService) { }

  @Roles(Role.SHOPOWNER)
  @Post()
  async create(@Body() createShopProductDto: CreateShopProductDto, @GetUser('shop_id') shop_id: number): Promise<ResponseType<ShopProductResponseDto>> {
    if (!shop_id) {
      throw new ForbiddenException('You are not associated with any shop. Please contact your administrator.');
    }
    return new ResponseData(await this.shopProductService.create(createShopProductDto, shop_id), HttpStatus.CREATED, HttpMessage.SUCCESS);
  }

  @Roles(Role.ADMIN)
  @Get('all')
  async findAll(): Promise<ResponseType<ShopProductResponseDto[]>> {
    return new ResponseData<ShopProductResponseDto[]>(await this.shopProductService.findAll(), HttpStatus.OK, HttpMessage.SUCCESS);
  }

  @Roles(Role.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ResponseType<ShopProductResponseDto>> {
    return new ResponseData(await this.shopProductService.findOne(+id), HttpStatus.OK, HttpMessage.SUCCESS);
  }

  @Roles(Role.SHOPOWNER, Role.STAFF)
  @Get()
  async findByShop(@GetUser('shop_id') shop_id: number): Promise<ResponseType<ShopProductResponseDto[]>> {
    if (!shop_id) {
      throw new ForbiddenException('You are not associated with any shop. Please contact your administrator.');
    }
    return new ResponseData<ShopProductResponseDto[]>(await this.shopProductService.findByShop(shop_id), HttpStatus.OK, HttpMessage.SUCCESS);
  }

  @Roles(Role.SHOPOWNER, Role.ADMIN)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateShopProductDto: UpdateShopProductDto, @GetUser() user: any): Promise<ResponseType<ShopProductResponseDto>> {
    const isAdmin = user.role === Role.ADMIN;
    const isShopOwnerWithShop = user.role === Role.SHOPOWNER && !!user.shop_id;
    if (!isAdmin && !isShopOwnerWithShop) {
      throw new ForbiddenException('You are not associated with any shop. Please contact your administrator.');
    }
    return new ResponseData(await this.shopProductService.update(+id, updateShopProductDto), HttpStatus.OK, HttpMessage.SUCCESS);
  }

  @Roles(Role.SHOPOWNER)
  @Delete(':id')
  async remove(@Param('id') id: string, @GetUser('shop_id') shop_id: number): Promise<ResponseType<{message: string}>> {
    if (!shop_id) {
      throw new ForbiddenException('You are not associated with any shop. Please contact your administrator.');
    }
    return new ResponseData(await this.shopProductService.remove(+id, shop_id), HttpStatus.OK, HttpMessage.SUCCESS);
  }

  @Roles(Role.ADMIN)
  @Delete('admin/:id')
  async removeAdmin(@Param('id') id: string): Promise<ResponseType<{message: string}>> {
    return new ResponseData(await this.shopProductService.remove(+id, 0, true), HttpStatus.OK, HttpMessage.SUCCESS);
  }
}
