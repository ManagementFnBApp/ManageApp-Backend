export class CreateOrderDto {
    customerId: number;
    userId: number;
    shiftId: number;
    note?: string;
    
}

export class UpdateOrderDto {
    customerId?: number;
    userId?: number;
    shiftId?: number;
    note?: string;
}