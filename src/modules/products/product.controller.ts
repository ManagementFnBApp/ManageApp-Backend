import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Put,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto, ProductMenuDto, ProductResponseDto, UpdateProductDto } from '../../dtos/product.dto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { GetUser, Public, Roles } from 'src/decorators/decorators';
import { HttpMessage, Role } from 'src/global/globalEnum';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ResponseData, ResponseType } from 'src/global/globalResponse';
import { JwtPayloadDto } from 'src/dtos/login.dto';

@Controller('products')
@UseGuards(AuthGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Roles(Role.ADMIN)
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
  async create(@Body() createProductDto: CreateProductDto, @UploadedFile() file: Express.Multer.File): Promise<ResponseType<ProductResponseDto>> {
    return new ResponseData(await this.productService.create(createProductDto, file.path), HttpStatus.CREATED, HttpMessage.SUCCESS);
  }

  @Roles(Role.STAFF, Role.SHOPOWNER)
  @Get('menu')
  async getMenu(@GetUser('') user: JwtPayloadDto): Promise<ResponseType<ProductMenuDto[]>> {
    if (!user)
      throw new UnauthorizedException('User not found');
    return new ResponseData<ProductMenuDto[]>(await this.productService.getMenu(user), HttpStatus.OK, HttpMessage.SUCCESS);
  }

  @Public()
  @Get()
  findAll(
    @Query('isActive', new ParseBoolPipe({ optional: true }))
    isActive?: boolean,
  ) {
    return this.productService.findAll(isActive);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ResponseType<ProductResponseDto>> {
    return new ResponseData(await this.productService.update(id, updateProductDto), HttpStatus.OK, HttpMessage.SUCCESS);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }

  @Delete(':id/hard')
  hardDelete(@Param('id', ParseIntPipe) id: number) {
    return this.productService.hardDelete(id);
  }
}
