import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @IsString()
  @IsNotEmpty()
  productName: string;

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

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateProductDto {
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  measureUnit?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  listPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  importPrice?: number;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ProductResponseDto {
  productId: number;
  categoryId: number;
  productName: string;
  image: string;
  barcode?: string | null;
  description?: string | null;
  measureUnit?: string | null;
  listPrice: number;
  importPrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
