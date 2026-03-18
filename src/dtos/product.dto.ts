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

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateProductDto {
  @IsInt()
  categoryId?: number;

  @IsString()
  productName?: string;

  @IsString()
  barcode?: string;

  @IsString()
  description?: string;

  @IsString()
  measureUnit?: string;

  @IsNumber()
  @Type(() => Number)
  listPrice?: number;

  @IsNumber()
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
