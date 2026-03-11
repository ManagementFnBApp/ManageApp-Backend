import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { OrderItemDto } from './order-item.dto';
import { Type } from 'class-transformer';

export class OrderDto {
  @IsOptional()
  @IsInt()
  customerId?: number;

  @IsInt()
  shiftUserId: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsNumber()
  totalAmount: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  order_items: OrderItemDto[];
}

export class ViewOrderDto {
  @IsOptional()
  @IsString()
  status: string;
}

export class OrderResponseDto {
  id: number;
  customerId: number;
  shiftUserId: number;
  note: string;
  totalAmount: number;
  orderStatus: string;
  createdAt?: string | null;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
}

export class OrderReportDto {
  numberOfOrders: number;
}