import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerResponseDto,
} from 'src/dtos/customer.dto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { GetUser, Roles } from 'src/decorators/decorators';
import { ResponseData, ResponseType } from 'src/global/globalResponse';
import { HttpMessage, HttpStatus, Role } from 'src/global/globalEnum';

@Controller('customers')
@UseGuards(AuthGuard)
export class CustomerController {
  constructor(private customerService: CustomerService) { }

  @Roles(Role.STAFF, Role.SHOPOWNER)
  @Post()
  async createCustomer(
    @Body() createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customerService.createCustomer(createCustomerDto);
  }

  @Roles(Role.SHOPOWNER)
  @Get()
  async getAllCustomers(
    @GetUser('shop_id') shop_id: number,
  ): Promise<ResponseType<CustomerResponseDto[]>> {
    try {
      return new ResponseData<CustomerResponseDto[]>(
        await this.customerService.getAllCustomers(shop_id),
        HttpStatus.SUCCESS,
        HttpMessage.SUCCESS,
      );
    } catch (error) {
      return new ResponseData<CustomerResponseDto[]>(
        null,
        HttpStatus.ERROR,
        error.message,
      );
    }
  }

  @Roles(Role.SHOPOWNER, Role.STAFF)
  @Get(':phone')
  async getCustomerByPhone(
    @Param('phone') phone: string,
    @GetUser('shop_id') shop_id: number,
  ): Promise<ResponseType<CustomerResponseDto>> {
    try {
      return new ResponseData<CustomerResponseDto>(
        await this.customerService.getCustomerByPhone(phone, shop_id),
        HttpStatus.SUCCESS,
        HttpMessage.SUCCESS,
      );
    } catch (error) {
      return new ResponseData<CustomerResponseDto>(
        null,
        HttpStatus.ERROR,
        error.message,
      );
    }
  }

  @Roles(Role.SHOPOWNER, Role.STAFF)
  @Put(':id')
  async updateCustomer(
    @Param('id') id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @GetUser('shop_id') shop_id: number,
  ): Promise<ResponseType<CustomerResponseDto>> {
    try {
      return new ResponseData(
        await this.customerService.updateCustomer(
          id,
          updateCustomerDto,
          shop_id,
        ),
        HttpStatus.SUCCESS,
        HttpMessage.SUCCESS,
      );
    } catch (error) {
      return new ResponseData<CustomerResponseDto>(
        null,
        HttpStatus.ERROR,
        error.message,
      );
    }
  }

  @Roles(Role.SHOPOWNER)
  @Delete(':id')
  async deleteCustomer(
    @Param('id') id: number,
    @GetUser('shop_id') shop_id: number,
  ): Promise<ResponseType<{ message: string }>> {
    try {
      return new ResponseData(
        await this.customerService.deleteCustomer(id, shop_id),
        HttpStatus.SUCCESS,
        HttpMessage.SUCCESS,
      );
    } catch (error) {
      return new ResponseData<{ message: string }>(
        null,
        HttpStatus.ERROR,
        error.message,
      );
    }
  }

  @Roles(Role.SHOPOWNER, Role.STAFF)
  @Put(':id/loyalty-points')
  async updateLoyaltyPoints(
    @Param('id') id: number,
    @Body('points') points: number,
    @GetUser('shop_id') shop_id: number,
  ): Promise<CustomerResponseDto> {
    return this.customerService.updateLoyaltyPoints(id, shop_id, points);
  }
}
