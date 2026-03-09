import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class OrderItemDto {
  @IsOptional()
  @IsInt()
  product_id?: number;

  @IsOptional()
  @IsInt()
  shop_product_id?: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  unit_price: number;
}
