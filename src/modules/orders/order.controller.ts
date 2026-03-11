import { Body, Controller, Param, Post, Put, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderDto, OrderReportDto, OrderResponseDto, ViewOrderDto } from 'src/dtos/oder.dto';
import { ResponseData, ResponseType } from 'src/global/globalResponse';
import { HttpMessage, HttpStatus, Role } from 'src/global/globalEnum';
import { ApiTags } from '@nestjs/swagger';
import { GetUser, Public, Roles } from 'src/decorators/decorators';
import { AuthGuard } from '../auth/guard/auth.guard';
import { JwtPayloadDto } from 'src/dtos/login.dto';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(AuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Roles(Role.STAFF, Role.SHOPOWNER)
  @Post()
  async createOrder(
    @Body() createOrderDto: OrderDto,
    @GetUser('id') userId: number,
  ): Promise<ResponseType<any>> {
    return new ResponseData(
      await this.orderService.createOrder(createOrderDto, userId),
      HttpStatus.SUCCESS,
      HttpMessage.SUCCESS,
    );
  }

  @Put(':id')
  async updateOrder(
    @Param('id') id: number,
    @Body() updateOrderDto: OrderDto,
    @GetUser('id') userId: number,
  ): Promise<ResponseType<OrderResponseDto>> {
    return new ResponseData(
      await this.orderService.updateOrder(id, updateOrderDto, userId),
      HttpStatus.SUCCESS,
      HttpMessage.SUCCESS,
    );
  }

  @Public()
  @Put(':id/complete')
  async completeOrder(
    @Param('id') id: number,
  ): Promise<ResponseType<OrderResponseDto>> {
    return new ResponseData(
      await this.orderService.completeOrder(id),
      HttpStatus.SUCCESS,
      HttpMessage.SUCCESS,
    );
  }

  @Put(':id/cancel')
  async cancelOrder(
    @Param('id') id: number,
  ): Promise<ResponseType<OrderResponseDto>> {
    return new ResponseData(
      await this.orderService.cancelOrder(id),
      HttpStatus.SUCCESS,
      HttpMessage.SUCCESS,
    );
  }

  @Roles(Role.STAFF, Role.SHOPOWNER)
  @Post('list')
  async getAllOrders(
    @Body() dto: ViewOrderDto,
    @GetUser('id') user_id: number,
  ): Promise<ResponseType<OrderResponseDto[]>> {
    return new ResponseData<OrderResponseDto[]>(
      await this.orderService.getAllOrders(dto, user_id),
      HttpStatus.SUCCESS,
      HttpMessage.SUCCESS,
    );
  }

  @Roles(Role.SHOPOWNER)
  @Post('report')
  async orderReport(@GetUser() user: JwtPayloadDto): Promise<ResponseType<OrderReportDto>> {
    return new ResponseData(
      await this.orderService.orderReport(user),
      HttpStatus.SUCCESS,
      HttpMessage.SUCCESS,
    );
  }
}
