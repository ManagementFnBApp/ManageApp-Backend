import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateMerchandiseDto {
  @IsString()
  merchandise_name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsInt()
  @Min(1)
  point_required: number;

  @IsInt()
  @Min(0)
  total_quantity: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateMerchandiseDto {
  @IsOptional()
  @IsString()
  merchandise_name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  point_required?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  total_quantity?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class MerchandiseResponseDto {
  id: number;
  shop_id: number;
  merchandise_name: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  point_required: number;
  total_quantity: number;
  is_active: boolean;
  created_at: string;
  update_at: string;
}
