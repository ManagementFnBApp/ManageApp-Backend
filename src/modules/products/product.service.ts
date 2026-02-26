import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateProductDto, UpdateProductDto, ProductResponseDto } from '../../dtos/product.dto';
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class ProductService {
    constructor(private prisma: PrismaService) { }

    async create(createProductDto: CreateProductDto): Promise<ProductResponseDto> {
        // Check if SKU already exists
        const existingProduct = await this.prisma.product.findUnique({
            where: { sku: createProductDto.sku }
        });

        if (existingProduct) {
            throw new ConflictException('Product with this SKU already exists');
        }

        // Check if category exists
        const category = await this.prisma.productCategory.findUnique({
            where: { category_id: createProductDto.categoryId }
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        const product = await this.prisma.product.create({
            data: {
                category_id: createProductDto.categoryId,
                product_name: createProductDto.productName,
                sku: createProductDto.sku,
                barcode: createProductDto.barcode,
                description: createProductDto.description,
                measure_unit: createProductDto.measureUnit,
                import_price: createProductDto.basicPrice,
                list_price: createProductDto.unitPrice,
                is_active: createProductDto.isActive ?? true,
            }
        });

        return this.mapToResponseDto(product);
    }

    async findAll(isActive?: boolean): Promise<ProductResponseDto[]> {
        const products = await this.prisma.product.findMany({
            where: isActive !== undefined ? { is_active: isActive } : undefined,
            orderBy: { created_at: 'desc' }
        });

        return products.map(product => this.mapToResponseDto(product));
    }

    async findOne(id: number): Promise<ProductResponseDto> {
        const product = await this.prisma.product.findUnique({
            where: { product_id: id },
            include: {
                category: true
            }
        });

        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        return this.mapToResponseDto(product);
    }

    async update(id: number, updateProductDto: UpdateProductDto): Promise<ProductResponseDto> {
        // Check if product exists
        const existingProduct = await this.prisma.product.findUnique({
            where: { product_id: id }
        });

        if (!existingProduct) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        // If SKU is being updated, check for conflicts
        if (updateProductDto.sku && updateProductDto.sku !== existingProduct.sku) {
            const skuConflict = await this.prisma.product.findUnique({
                where: { sku: updateProductDto.sku }
            });

            if (skuConflict) {
                throw new ConflictException('Product with this SKU already exists');
            }
        }

        // If category is being updated, check if it exists
        if (updateProductDto.categoryId) {
            const category = await this.prisma.productCategory.findUnique({
                where: { category_id: updateProductDto.categoryId }
            });

            if (!category) {
                throw new NotFoundException('Category not found');
            }
        }

        const product = await this.prisma.product.update({
            where: { product_id: id },
            data: {
                category_id: updateProductDto.categoryId,
                product_name: updateProductDto.productName,
                sku: updateProductDto.sku,
                barcode: updateProductDto.barcode,
                description: updateProductDto.description,
                measure_unit: updateProductDto.measureUnit,
                import_price: updateProductDto.basicPrice,
                list_price: updateProductDto.unitPrice,
                is_active: updateProductDto.isActive,
            }
        });

        return this.mapToResponseDto(product);
    }

    async remove(id: number): Promise<{ message: string }> {
        // Check if product exists
        const product = await this.prisma.product.findUnique({
            where: { product_id: id }
        });

        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        // Soft delete by setting is_active to false
        await this.prisma.product.update({
            where: { product_id: id },
            data: { is_active: false }
        });

        return { message: `Product with ID ${id} has been deactivated` };
    }

    async hardDelete(id: number): Promise<{ message: string }> {
        // Check if product exists
        const product = await this.prisma.product.findUnique({
            where: { product_id: id }
        });

        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        await this.prisma.product.delete({
            where: { product_id: id }
        });

        return { message: `Product with ID ${id} has been permanently deleted` };
    }

    private mapToResponseDto(product: any): ProductResponseDto {
        return {
            productId: product.product_id,
            categoryId: product.category_id,
            productName: product.product_name,
            sku: product.sku,
            barcode: product.barcode,
            description: product.description,
            measureUnit: product.measure_unit,
            basicPrice: Number(product.import_price),
            unitPrice: Number(product.list_price),
            isActive: product.is_active,
            createdAt: product.created_at,
            updatedAt: product.updated_at,
        };
    }
}
