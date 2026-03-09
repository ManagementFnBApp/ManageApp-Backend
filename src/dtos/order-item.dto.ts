import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class OrderItemDto {
  @IsInt()
  @IsOptional()
  product_id?: number;

  @IsInt()
  @IsOptional()
  shop_product_id?: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  unit_price: number;
}
