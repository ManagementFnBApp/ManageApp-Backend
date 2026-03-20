import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, ForbiddenException, UseInterceptors, UploadedFile, UnauthorizedException } from '@nestjs/common';
import { ShopProductService } from './shop-product.service';
import { CreateShopProductDto, ShopProductResponseDto, UpdateShopProductDto } from 'src/dtos/shop-product.dto';
import { GetUser, Roles } from 'src/decorators/decorators';
import { HttpMessage, Role } from 'src/global/globalEnum';
import { ResponseData, ResponseType } from 'src/global/globalResponse';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtPayloadDto } from 'src/dtos/login.dto';

@Controller('shop-products')
export class ShopProductController {
  constructor(private readonly shopProductService: ShopProductService) { }

  @Roles(Role.SHOPOWNER)
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  @Post()
  async create(@Body() createShopProductDto: CreateShopProductDto, @GetUser('shop_id') shop_id: number, @UploadedFile() file: Express.Multer.File): Promise<ResponseType<ShopProductResponseDto>> {
    if (!shop_id) {
      throw new ForbiddenException('You are not associated with any shop. Please contact your administrator.');
    }
    return new ResponseData(await this.shopProductService.create(createShopProductDto, shop_id, file.path), HttpStatus.CREATED, HttpMessage.SUCCESS);
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

  @Roles(Role.SHOPOWNER)
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() updateShopProductDto: UpdateShopProductDto,
    @GetUser() user: any,
    @UploadedFile() file: Express.Multer.File):
    Promise<ResponseType<ShopProductResponseDto>> {
    const isShopOwnerWithShop = user.role === Role.SHOPOWNER && !!user.shop_id;
    if (!isShopOwnerWithShop) {
      throw new ForbiddenException('You are not associated with any shop. Please contact your administrator.');
    }
    return new ResponseData(await this.shopProductService.update(+id, updateShopProductDto, file?.path), HttpStatus.OK, HttpMessage.SUCCESS);
  }

  @Roles(Role.SHOPOWNER)
  @Delete(':id')
  async remove(@Param('id') id: string, @GetUser('shop_id') shop_id: number): Promise<ResponseType<{ message: string }>> {
    if (!shop_id) {
      throw new ForbiddenException('You are not associated with any shop. Please contact your administrator.');
    }
    return new ResponseData(await this.shopProductService.remove(+id, shop_id), HttpStatus.OK, HttpMessage.SUCCESS);
  }

  @Roles(Role.ADMIN)
  @Delete('admin/:id')
  async removeAdmin(@Param('id') id: string): Promise<ResponseType<{ message: string }>> {
    return new ResponseData(await this.shopProductService.remove(+id, 0, true), HttpStatus.OK, HttpMessage.SUCCESS);
  }

  @Roles(Role.SHOPOWNER, Role.STAFF)
  @Get('menu')
  async getMenu(@GetUser() user: JwtPayloadDto) {
    if(!user)
      throw new UnauthorizedException('User not found');
    return new ResponseData(await this.shopProductService.getMenu(user), HttpStatus.OK, HttpMessage.SUCCESS);
  }
}
