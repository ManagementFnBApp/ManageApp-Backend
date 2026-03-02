import { IsInt, IsNumber, Min } from "class-validator";

export class CreateOrderItemDto {
  @IsInt()
  product_id: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  unit_price: number;
}