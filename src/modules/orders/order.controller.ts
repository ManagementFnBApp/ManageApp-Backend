import { Controller } from "@nestjs/common";
import { OrderService } from "./order.service";

@Controller('orders')
export class OrderController {
    constructor(
        private readonly orderService: OrderService
    ) {}

    @Post()
    async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
        return this.orderService.createOrder(createOrderDto);
    }
}