import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInventoryDto {
  @IsInt()
  @IsNotEmpty()
  shopId: number;

  @IsInt()
  @IsOptional()
  currentQuantity?: number;

  @IsInt()
  @IsOptional()
  minimumThreshold?: number;

  @IsInt()
  @IsOptional()
  reorderQuantity?: number;
}

export class UpdateInventoryDto {
  @IsInt()
  @IsOptional()
  shopId?: number;

  @IsInt()
  @IsOptional()
  currentQuantity?: number;

  @IsInt()
  @IsOptional()
  minimumThreshold?: number;

  @IsInt()
  @IsOptional()
  reorderQuantity?: number;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  lastRestockAt?: Date;
}

export class InventoryResponseDto {
  inventoryId: number;
  shopId: number;
  currentQuantity: number;
  minimumThreshold?: number | null;
  reorderQuantity?: number | null;
  lastRestockAt?: Date | null;
  updateAt: Date;
}

export class CreateInventoryItemDto {
  @IsInt()
  @IsOptional()
  productId?: number;

  @IsInt()
  @IsOptional()
  shopProductId?: number;

  @IsInt()
  @IsNotEmpty()
  inventoryId: number;

  @IsInt()
  @IsOptional()
  quantity?: number;

  @IsInt()
  @IsOptional()
  reservedQuantity?: number;
}

export class UpdateInventoryItemDto {
  @IsInt()
  @IsOptional()
  productId?: number;

  @IsInt()
  @IsOptional()
  shopProductId?: number;

  @IsInt()
  @IsOptional()
  inventoryId?: number;

  @IsInt()
  @IsOptional()
  quantity?: number;

  @IsInt()
  @IsOptional()
  reservedQuantity?: number;
}

export class InventoryItemResponseDto {
  inventoryItemId: number;
  productId?: number | null;
  shopProductId?: number | null;
  productType?: 'SYSTEM' | 'SHOP';
  inventoryId: number;
  quantity: number;
  reservedQuantity?: number | null;
  updatedAt: Date;
}

export class DecreaseItemDto {
  product_id: number | null | undefined;
  shop_product_id: number | null | undefined;
  quantity: number;
  shop_id: number;
}