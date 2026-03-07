import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsDecimal,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsOptional()
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

export class UpdateProductDto {
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @IsString()
  @IsOptional()
  productName?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  measureUnit?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  listPrice?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  importPrice?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ProductResponseDto {
  productId: number;
  categoryId: number;
  productName: string;
  sku: string;
  barcode?: string | null;
  description?: string | null;
  measureUnit?: string | null;
  listPrice: number;
  importPrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
