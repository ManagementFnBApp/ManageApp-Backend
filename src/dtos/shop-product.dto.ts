import { PartialType } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateShopProductDto {
    @Type(() => Number)
    @IsInt()
    @IsNotEmpty()
    categoryId: number;

    @IsString()
    @IsNotEmpty()
    productName: string;

    @IsString()
    barcode?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    measureUnit?: string;

    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    listPrice: number;

    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    importPrice: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateShopProductDto extends PartialType(CreateShopProductDto) { }

export class ShopProductResponseDto {
    id: number;

    shop_id: number;

    shop_name: string;
    category_id: number;

    category_name: string;

    product_name: string;

    image: string;

    barcode?: string;

    description?: string;

    measure_unit?: string;

    list_price: number;

    import_price: number;

    is_active: boolean;
}