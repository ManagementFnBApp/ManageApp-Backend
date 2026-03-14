import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
} from '../../dtos/product.dto';
import { PrismaService } from 'db/prisma.service';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) { }

  async create(
    createProductDto: CreateProductDto,
    imagePath: string,
  ): Promise<ProductResponseDto> {
    // Check if image already exists

    // Check if category exists
    const category = await this.prisma.category.findUnique({
      where: { id: createProductDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const existingProduct = await this.prisma.product.findFirst({
      where: {
        barcode: createProductDto.barcode,
      },
    });

    if (existingProduct) {
      throw new ConflictException('Product with this barcode already exists');
    }

    const product = await this.prisma.product.create({
      data: {
        category_id: createProductDto.categoryId,
        product_name: createProductDto.productName,
        image: this.configService.get<string>('SERVER_IMAGE_URL') + '/' + imagePath,
        barcode: createProductDto.barcode,
        description: createProductDto.description,
        measure_unit: createProductDto.measureUnit,
        list_price: createProductDto.listPrice,
        import_price: createProductDto.importPrice,
        is_active: createProductDto.isActive ?? true,
      },
    });

    return this.mapToResponseDto(product);
  }

  async findAll(isActive?: boolean): Promise<ProductResponseDto[]> {
    const products = await this.prisma.product.findMany({
      where: isActive !== undefined ? { is_active: isActive } : undefined,
      orderBy: { created_at: 'desc' },
    });

    return products.map((product) => this.mapToResponseDto(product));
  }

  async findOne(id: number): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: id },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.mapToResponseDto(product);
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    imagePath?: string
  ): Promise<ProductResponseDto> {
    // Check if product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { id: id },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // If category is being updated, check if it exists
    if (updateProductDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const product = await this.prisma.product.update({
      where: { id: id },
      data: {
        category_id: updateProductDto.categoryId,
        product_name: updateProductDto.productName,
        image: this.configService.get<string>('SERVER_IMAGE_URL') + '/' + imagePath,
        barcode: updateProductDto.barcode,
        description: updateProductDto.description,
        measure_unit: updateProductDto.measureUnit,
        list_price: updateProductDto.listPrice,
        import_price: updateProductDto.importPrice,
        is_active: updateProductDto.isActive,
      },
    });

    return this.mapToResponseDto(product);
  }

  async remove(id: number): Promise<{ message: string }> {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Soft delete by setting is_active to false
    await this.prisma.product.update({
      where: { id: id },
      data: { is_active: false },
    });

    return { message: `Product with ID ${id} has been deactivated` };
  }

  async hardDelete(id: number): Promise<{ message: string }> {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const imagePath = join(process.cwd(), 'uploads', product.image);

    try {
      await fs.unlink(imagePath);
    } catch (err) {
      // Nếu file không tồn tại cũng không sao, chỉ cần log lại
      console.error('Image path not exists:', err.message);
    }

    await this.prisma.product.delete({
      where: { id: id },
    });

    return { message: `Product with ID ${id} has been permanently deleted` };
  }

  async validateProductsExist(productIds: number[]) {
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        is_active: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException(
        'Một hoặc nhiều sản phẩm không tồn tại hoặc đã ngừng bán.',
      );
    }
    return products;
  }

  private mapToResponseDto(product: any): ProductResponseDto {
    return {
      productId: product.id,
      categoryId: product.category_id,
      productName: product.product_name,
      image: product.image,
      barcode: product.barcode,
      description: product.description,
      measureUnit: product.measure_unit,
      listPrice: Number(product.list_price),
      importPrice: Number(product.import_price),
      isActive: product.is_active,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    };
  }
}
