import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateOrderDto, OrderResponseDto, UpdateOrderDto } from "src/dtos/oder.dto";
import { OrderStatus } from "src/global/globalEnum";

@Injectable()
export class OrderService {
    constructor(
        private prisma: PrismaService
    ) { }

    async createOrder(data: CreateOrderDto): Promise<OrderResponseDto> {
        const order = await this.prisma.orders.create({
            data: {
                shift_id: data.shiftId,
                user_id: data.userId,
                customer_id: data.customerId,
                total_amount: data.totalAmount,
                order_status: OrderStatus.PENDING,
                notes: data.note || null,
                completed_at: null,
                cancelled_at: null
            }
        });
        return this.transformToDto(order);
    }

    async updateOrder(id: number, data: UpdateOrderDto): Promise<OrderResponseDto> {
        const existingOrder = await this.prisma.orders.findUnique({
            where: { id: Number(id) }
        });
        const order = await this.prisma.orders.update({
            where: { id: Number(id) },
            data: {
                shift_id: data.shiftId,
                user_id: data.userId,
                customer_id: data.customerId,
                total_amount: data.totalAmount,
                order_status: OrderStatus.PENDING,
                notes: data.note || null,
                completed_at: existingOrder?.completed_at || null,
                cancelled_at: existingOrder?.cancelled_at || null
            }
        });
        return this.transformToDto(order);
    }

    async completeOrder(id: number): Promise<OrderResponseDto> {
        const order = await this.prisma.orders.update({
            where: { id: Number(id) },
            data: {
                order_status: OrderStatus.COMPLETED,
                completed_at: new Date()
            }
        });
        return this.transformToDto(order);
    }

    async cancelOrder(id: number): Promise<OrderResponseDto> {
        const order = await this.prisma.orders.update({
            where: { id: Number(id) },
            data: {
                order_status: OrderStatus.CANCELLED,
                cancelled_at: new Date()
            }
        });
        return this.transformToDto(order);
    }

    async getAllOrders(status: string): Promise<OrderResponseDto[]> {
        const orders = await this.prisma.orders.findMany({
            where: {
                order_status: status,
            }
        });
        return orders.map(order => this.transformToDto(order));
    }

    transformToDto(order: any): OrderResponseDto {
        return {
            id: order.id,
            customerId: order.customer_id,
            userId: order.user_id,
            shiftId: order.shift_id,
            note: order.notes || null,
            totalAmount: order.total_amount,
            orderStatus: order.order_status,
            completedAt: order.completed_at || null,
            cancelledAt: order.cancelled_at || null
        };
    }
}