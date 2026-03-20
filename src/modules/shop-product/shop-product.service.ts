import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'db/prisma.service';
import { join } from 'path';
import { CreateShopProductDto, ShopProductResponseDto, UpdateShopProductDto } from 'src/dtos/shop-product.dto';
import * as fs from 'fs/promises';
import { JwtPayloadDto } from 'src/dtos/login.dto';

@Injectable()
export class ShopProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  async create(createShopProductDto: CreateShopProductDto, shop_id: number, imagePath: string): Promise<ShopProductResponseDto> {
    const [shop, category] = await Promise.all([
      this.prisma.shop.findUnique({ where: { id: shop_id } }),
      this.prisma.category.findUnique({ where: { id: createShopProductDto.categoryId } }),
    ]);

    if (!shop) {
      throw new NotFoundException(`Shop with id ${shop_id} not found`);
    }
    if (!category) {
      throw new NotFoundException(`Category with id ${createShopProductDto.categoryId} not found`)
    };

    const existingShopProduct = await this.prisma.shopProduct.findFirst({
      where: {
        barcode: createShopProductDto.barcode,
      }
    });

    const existingProduct = await this.prisma.product.findFirst({
      where: {
        barcode: createShopProductDto.barcode,
      }
    });

    if (existingProduct || existingShopProduct) {
      throw new BadRequestException(`Product with barcode ${createShopProductDto.barcode} already exists`);
    }

    try {
      const shopProduct = await this.prisma.shopProduct.create({
        data: {
          shop_id,
          category_id: createShopProductDto.categoryId,
          product_name: createShopProductDto.productName,
          image: this.configService.get<string>('SERVER_IMAGE_URL') + '/' + imagePath,
          barcode: createShopProductDto.barcode,
          description: createShopProductDto.description,
          measure_unit: createShopProductDto.measureUnit,
          list_price: createShopProductDto.listPrice,
          import_price: createShopProductDto.importPrice,
          is_active: createShopProductDto.isActive,
        },
        include: {
          category: true,
          shop: true,
        }
      });
      return this.transformToResponseDto(shopProduct);
    } catch (error) {
      // Delete the uploaded image if an error occurs
      try {
        await fs.unlink(imagePath);
      } catch (unlinkError) {
        console.error('Failed to delete image after error:', unlinkError.message);
      }
      throw error;
    }
  }

  async findAll(): Promise<ShopProductResponseDto[]> {
    const shopProducts = await this.prisma.shopProduct.findMany({
      include: {
        category: true,
        shop: true,
      }
    });
    return shopProducts.map((product) => this.transformToResponseDto(product));
  }

  async findOne(id: number): Promise<ShopProductResponseDto> {
    const shopProduct = await this.prisma.shopProduct.findUnique({
      where: {
        id,
      },
    });
    return this.transformToResponseDto(shopProduct);
  }

  async findByShop(shop_id: number): Promise<ShopProductResponseDto[]> {
    const shopProducts = await this.prisma.shopProduct.findMany({
      where: {
        shop_id,
      },
      include: {
        shop: true,
        category: true,
      }
    });
    return shopProducts.map((product) => this.transformToResponseDto(product));
  }

  async update(id: number, updateShopProductDto: UpdateShopProductDto, imagePath?: string): Promise<ShopProductResponseDto> {
    const existingProduct = await this.prisma.shopProduct.findUnique({
      where: { id: id },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // If category is being updated, check if it exists
    if (updateShopProductDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateShopProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    };

    const updated = await this.prisma.shopProduct.update({
      where: { id },
      data: {
        category_id: updateShopProductDto.categoryId !== undefined ? updateShopProductDto.categoryId : existingProduct.category_id,
        product_name: updateShopProductDto.productName !== undefined ? updateShopProductDto.productName : existingProduct.product_name,
        image: imagePath !== undefined ? (this.configService.get<string>('SERVER_IMAGE_URL') + '/' + imagePath) : existingProduct.image,
        barcode: updateShopProductDto.barcode !== undefined ? updateShopProductDto.barcode : existingProduct.barcode,
        description: updateShopProductDto.description !== undefined ? updateShopProductDto.description : existingProduct.description,
        measure_unit: updateShopProductDto.measureUnit !== undefined ? updateShopProductDto.measureUnit : existingProduct.measure_unit,
        list_price: updateShopProductDto.listPrice !== undefined ? updateShopProductDto.listPrice : existingProduct.list_price,
        import_price: updateShopProductDto.importPrice !== undefined ? updateShopProductDto.importPrice : existingProduct.import_price,
        is_active: updateShopProductDto.isActive !== undefined ? updateShopProductDto.isActive : existingProduct.is_active,
      },
    });

    return this.transformToResponseDto(updated);
  }

  async remove(id: number, shop_id: number, skipOwnerCheck = false): Promise<{ message: string }> {
    if (!skipOwnerCheck) {
      const shopProduct = await this.prisma.shopProduct.findUnique({
        where: { id },
      });

      if (!shopProduct) {
        throw new NotFoundException(`Product with id ${id} not found`);
      }

      const imagePath = join(process.cwd(), 'uploads', shopProduct.image);

      try {
        await fs.unlink(imagePath);
      } catch (err) {
        // Nếu file không tồn tại cũng không sao, chỉ cần log lại
        console.error('Image path not exists:', err.message);
      }

      if (shopProduct.shop_id !== shop_id) {
        throw new ForbiddenException(`You are not allowed to delete this product`);
      }
    }
    await this.prisma.shopProduct.delete({
      where: { id },
    });

    return { message: 'Product removed successfully' };
  }

  async getMenu(user: JwtPayloadDto) {
    const shopProducts = await this.prisma.shopProduct.findMany({
      include: {
        inventory_items: {
          where: {
            inventory: {
              shop_id: user.shop_id,
            },
          },
          select: {
            quantity: true,
          },
        },
      },
    });

    return shopProducts.map((shopProduct) => {
      const totalQuantity = shopProduct.inventory_items.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );

      return {
        ...this.transformToResponseDto(shopProduct),
        quantity: totalQuantity
      };
    });
  }

  transformToResponseDto(shopProduct: any) {
    return {
      id: shopProduct.id,
      shop_id: shopProduct.shop_id,
      shop_name: shopProduct.shop?.shop_name,
      category_id: shopProduct.category_id,
      category_name: shopProduct.category?.category_name,
      product_name: shopProduct.product_name,
      image: shopProduct.image,
      barcode: shopProduct.barcode,
      description: shopProduct.description,
      measure_unit: shopProduct.measure_unit,
      list_price: shopProduct.list_price,
      import_price: shopProduct.import_price,
      is_active: shopProduct.is_active,
    };
  }
}
