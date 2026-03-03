import { IsInt, IsNumber, Min } from "class-validator";

export class OrderItemDto {
  @IsInt()
  product_id: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  unit_price: number;
}