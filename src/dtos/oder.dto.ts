import { IsArray, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { CreateOrderItemDto } from "./order-item.dto";
import { Type } from "class-transformer";

export class CreateOrderDto {
    @IsOptional()
    @IsInt()
    customerId?: number;

    @IsInt()
    shiftId: number;

    @IsOptional()
    @IsString()
    note?: string;

    @IsNumber()
    totalAmount: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    order_items: CreateOrderItemDto[];
}

export class UpdateOrderDto {
    customerId?: number;
    userId?: number;
    shiftId?: number;
    note?: string;
    totalAmount?: number;
}

export class ViewOrderDto {
    @IsString()
    status: string;
}

export class OrderResponseDto {
    id: number;
    customerId: number;
    userId: number;
    shiftId: number;
    note: string;
    totalAmount: number;
    orderStatus: string;
    completedAt?: Date | null;
    cancelledAt?: Date | null;
}