export class CreateOrderDto {
    customerId: number;
    userId: number;
    shiftId: number;
    note?: string;
    totalAmount: number;
}

export class UpdateOrderDto {
    customerId?: number;
    userId?: number;
    shiftId?: number;
    note?: string;
    totalAmount?: number;
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