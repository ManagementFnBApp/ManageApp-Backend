import { Injectable } from "@nestjs/common";

@Injectable()
export class OrderService {
    async createOrder(createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
        
    }
}