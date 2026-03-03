import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { CustomerService } from "./customer.service";
import { CreateCustomerDto, UpdateCustomerDto, CustomerResponseDto } from "src/dtos/customer.dto";
import { AuthGuard } from "../auth/guard/auth.guard";
import { GetUser } from "src/decorators/decorators";

@Controller('customers')
@UseGuards(AuthGuard)
export class CustomerController {
    constructor(private customerService: CustomerService) { }

    @Post()
    async createCustomer(@Body() createCustomerDto: CreateCustomerDto): Promise<CustomerResponseDto> {
        return this.customerService.createCustomer(createCustomerDto);
    }

    @Get()
    async getAllCustomers(@GetUser('shop_id') shop_id: number): Promise<CustomerResponseDto[]> {
        return this.customerService.getAllCustomers(shop_id);
    }

    @Get(':id')
    async getCustomerById(@Param('id') id: number, @GetUser('shop_id') shop_id: number): Promise<CustomerResponseDto> {
        return this.customerService.getCustomerById(id, shop_id);
    }

    @Get(':phone')
    async getCustomerByPhone(@Param('phone') phone: string, @GetUser('shop_id') shop_id: number): Promise<CustomerResponseDto> {
        return this.customerService.getCustomerByPhone(phone, shop_id);
    }

    @Put(':id')
    async updateCustomer(
        @Param('id') id: number,
        @Body() updateCustomerDto: UpdateCustomerDto,
        @GetUser('shop_id') shop_id: number
    ): Promise<CustomerResponseDto> {
        return this.customerService.updateCustomer(id, updateCustomerDto, shop_id);
    }

    @Delete(':id')
    async deleteCustomer(@Param('id') id: number, @GetUser('shop_id') shop_id: number): Promise<{ message: string }> {
        return this.customerService.deleteCustomer(id, shop_id);
    }

    @Put(':id/loyalty-points')
    async updateLoyaltyPoints(
        @Param('id') id: number,
        @Body('points') points: number,
        @GetUser('shop_id') shop_id: number
    ): Promise<CustomerResponseDto> {
        return this.customerService.updateLoyaltyPoints(id, shop_id, points);
    }
}
