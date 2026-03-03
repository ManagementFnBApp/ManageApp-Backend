import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateCustomerDto, UpdateCustomerDto, CustomerResponseDto } from "src/dtos/customer.dto";

@Injectable()
export class CustomerService {
    constructor(private prisma: PrismaService) { }

    async createCustomer(data: CreateCustomerDto): Promise<CustomerResponseDto> {
        const customer = await this.prisma.customer.create({
            data: {
                shop_id: data.shop_id,
                phone: data.phone,
                full_name: data.full_name || null,
                loyalty_point: data.loyalty_point || 0,
            }
        });
        return this.transformToDto(customer);
    }

    async getAllCustomers(shop_id: number): Promise<CustomerResponseDto[]> {
        const customers = await this.prisma.customer.findMany({
            where: { shop_id },
            orderBy: { created_at: 'desc' }
        });
        return customers.map(customer => this.transformToDto(customer));
    }

    async getCustomerById(id: number, shop_id: number): Promise<CustomerResponseDto> {
        const customer = await this.prisma.customer.findFirst({
            where: {
                id: Number(id),
                shop_id
            }
        });

        if (!customer) {
            throw new NotFoundException(`Customer with ID ${id} not found`);
        }

        return this.transformToDto(customer);
    }

    async updateCustomer(id: number, data: UpdateCustomerDto, shop_id: number): Promise<CustomerResponseDto> {
        // Check if customer exists and belongs to the shop
        const existingCustomer = await this.prisma.customer.findFirst({
            where: {
                id: Number(id),
                shop_id
            }
        });

        if (!existingCustomer) {
            throw new NotFoundException(`Customer with ID ${id} not found`);
        }

        const customer = await this.prisma.customer.update({
            where: { id: Number(id) },
            data: {
                phone: data.phone,
                full_name: data.full_name,
                loyalty_point: data.loyalty_point,
            }
        });

        return this.transformToDto(customer);
    }

    async deleteCustomer(id: number, shop_id: number): Promise<{ message: string }> {
        // Check if customer exists and belongs to the shop
        const existingCustomer = await this.prisma.customer.findFirst({
            where: {
                id: Number(id),
                shop_id
            }
        });

        if (!existingCustomer) {
            throw new NotFoundException(`Customer with ID ${id} not found`);
        }

        await this.prisma.customer.delete({
            where: { id: Number(id) }
        });

        return { message: `Customer with ID ${id} has been deleted successfully` };
    }

    async updateLoyaltyPoints(id: number, shop_id: number, points: number): Promise<CustomerResponseDto> {
        const customer = await this.prisma.customer.findFirst({
            where: {
                id: Number(id),
                shop_id
            }
        });

        if (!customer) {
            throw new NotFoundException(`Customer with ID ${id} not found`);
        }

        const updatedCustomer = await this.prisma.customer.update({
            where: { id: Number(id) },
            data: {
                loyalty_point: (customer.loyalty_point || 0) + points
            }
        });

        return this.transformToDto(updatedCustomer);
    }

    async getCustomerByPhone(phone: string, shop_id: number): Promise<CustomerResponseDto> {
        const customer = await this.prisma.customer.findFirst({
            where: {
                phone,
                shop_id
            }
        });

        if (!customer) {
            throw new NotFoundException(`Customer with phone ${phone} not found`);
        }

        return this.transformToDto(customer);
    }

    private transformToDto(customer: any): CustomerResponseDto {
        return {
            id: customer.id,
            shop_id: customer.shop_id,
            phone: customer.phone,
            full_name: customer.full_name,
            loyalty_point: customer.loyalty_point || 0,
            created_at: customer.created_at?.toISOString()
        };
    }
}
