import { Body, Controller, Param, Post, Put, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderDto, OrderMonthReportDto, OrderReportDto, OrderResponseDto, ViewOrderDto } from 'src/dtos/oder.dto';
import { ResponseData, ResponseType } from 'src/global/globalResponse';
import { HttpMessage, HttpStatus, Role } from 'src/global/globalEnum';
import { ApiTags } from '@nestjs/swagger';
import { GetUser, IsActive, Public, Roles } from 'src/decorators/decorators';
import { AuthGuard } from '../auth/guard/auth.guard';
import { JwtPayloadDto } from 'src/dtos/login.dto';
import type { PayosIPN } from '../payos/payos.service';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(AuthGuard)
@IsActive()
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Roles(Role.STAFF, Role.SHOPOWNER)
  @Post()
  async createOrder(
    @Body() createOrderDto: OrderDto,
    @GetUser('') user: JwtPayloadDto,
  ): Promise<ResponseType<any>> {
    return new ResponseData(
      await this.orderService.createOrder(createOrderDto, user),
      HttpStatus.SUCCESS,
      HttpMessage.SUCCESS,
    );
  }

  /**
   * Create order + PayOS payment in one call.
   * Returns checkoutUrl and qrCode for the customer.
   */
  @Roles(Role.STAFF, Role.SHOPOWNER)
  @Post('pay')
  async createOrderWithPayment(
    @Body() createOrderDto: OrderDto,
    @GetUser() user: JwtPayloadDto,
  ): Promise<ResponseType<any>> {
    return new ResponseData(
      await this.orderService.createOrderWithPayment(createOrderDto, user),
      HttpStatus.SUCCESS,
      HttpMessage.SUCCESS,
    );
  }

  /**
   * Public webhook endpoint for PayOS IPN callbacks.
   * Updates order + payment status to PAID or CANCELLED.
   */
  @Public()
  @Post('payos/webhook')
  async handlePayosWebhook(
    @Body() webhookData: PayosIPN,
  ): Promise<ResponseType<any>> {
    return new ResponseData(
      await this.orderService.handlePayosOrderWebhook(webhookData),
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
  async orderReport(@Body() dto: OrderMonthReportDto, @GetUser() user: JwtPayloadDto): Promise<ResponseType<OrderReportDto>> {
    return new ResponseData(
      await this.orderService.orderReport(dto, user),
      HttpStatus.SUCCESS,
      HttpMessage.SUCCESS,
    );
  }
}
