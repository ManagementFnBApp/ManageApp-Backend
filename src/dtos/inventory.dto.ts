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
  @IsNotEmpty()
  productId: number;

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
  productId: number;
  inventoryId: number;
  quantity: number;
  reservedQuantity?: number | null;
  updatedAt: Date;
}
