import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'db/prisma.service';
import { CreateShopProductDto, UpdateShopProductDto } from 'src/dtos/shop-product.dto';

@Injectable()
export class ShopProductService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async create(createShopProductDto: CreateShopProductDto, shop_id: number): Promise<any> {
    const [shop, category] = await Promise.all([
      this.prisma.shop.findUnique({ where: { id: shop_id } }),
      this.prisma.category.findUnique({ where: { id: createShopProductDto.categoryId } }),
    ]);

    if (!shop) throw new NotFoundException(`Shop with id ${shop_id} not found`);
    if (!category) throw new NotFoundException(`Category with id ${createShopProductDto.categoryId} not found`);

    return await this.prisma.shopProduct.create({
      data: {
        shop_id,
        category_id: createShopProductDto.categoryId,
        product_name: createShopProductDto.productName,
        image: createShopProductDto.image,
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
    })
  }

  async findAll() {
    return await this.prisma.shopProduct.findMany({
      include: {
        category: true,
        shop: true,
      }
    });
  }

  async findOne(id: number) {
    return await this.prisma.shopProduct.findUnique({
      where: {
        id,
      },
    });
  }

  async update(id: number, updateShopProductDto: UpdateShopProductDto) {
    return await this.prisma.shopProduct.update({
      where: {
        id,
      },
      data: updateShopProductDto,
    });
  }

  async remove(id: number) {
    return await this.prisma.shopProduct.delete({
      where: {
        id,
      },
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
