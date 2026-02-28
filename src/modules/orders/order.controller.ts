import { Body, Controller, Param, Post, Put } from "@nestjs/common";
import { OrderService } from "./order.service";
import { CreateOrderDto, OrderResponseDto, UpdateOrderDto } from "src/dtos/oder.dto";
import { ResponseData, ResponseType } from "src/global/globalResponse";
import { HttpMessage, HttpStatus, Role } from "src/global/globalEnum";
import { ApiTags } from "@nestjs/swagger";
import { Public, Roles } from "src/decorators/decorators";

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
    constructor(
        private readonly orderService: OrderService
    ) {}

    @Public()
    @Post()
    async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<ResponseType<OrderResponseDto>> {
        return new ResponseData( await this.orderService.createOrder(createOrderDto), HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    }

    @Put(':id')
    async updateOrder(
        @Param('id') id: number,
        @Body() updateOrderDto: UpdateOrderDto
    ): Promise<ResponseType<OrderResponseDto>> {
        return new ResponseData( await this.orderService.updateOrder(id, updateOrderDto), HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    }

    @Public()
    @Put(':id/complete')
    async completeOrder(
        @Param('id') id: number
    ): Promise<ResponseType<OrderResponseDto>> {
        return new ResponseData( await this.orderService.completeOrder(id), HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    }

    @Put(':id/cancel')
    async cancelOrder(
        @Param('id') id: number
    ): Promise<ResponseType<OrderResponseDto>> {
        return new ResponseData( await this.orderService.cancelOrder(id), HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    }

    @Roles(Role.STAFF, Role.SHOPOWNER)
    @Post('list')
    async getAllPendingOrders(@Body() status: string): Promise<ResponseType<OrderResponseDto[]>> {
        return new ResponseData<OrderResponseDto[]>( await this.orderService.getAllOrders(status), HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    }
}