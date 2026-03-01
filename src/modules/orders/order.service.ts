import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateOrderDto, OrderResponseDto, UpdateOrderDto, ViewOrderDto } from "src/dtos/oder.dto";
import { OrderStatus } from "src/global/globalEnum";
import { ProductService } from "../products/product.service";

@Injectable()
export class OrderService {
    constructor(
        private prisma: PrismaService,
        private productsService: ProductService
    ) { }

    async createOrder(data: CreateOrderDto, user_id: number): Promise<any> {
        const { order_items, ...orderInfo } = data;

        // 1. Lấy danh sách ID sản phẩm để kiểm tra
        const productIds = order_items.map(item => item.product_id);
        await this.productsService.validateProductsExist(productIds);

        const order = await this.prisma.$transaction(async (prismaTx) => {
            return prismaTx.orders.create({
                data: {
                    customer_id: orderInfo.customerId,
                    user_id: user_id,
                    shift_id: orderInfo.shiftId,
                    total_amount: orderInfo.totalAmount,
                    order_status: OrderStatus.PENDING,
                    notes: orderInfo.note || null,
                    completed_at: null,
                    cancelled_at: null,
                    order_items: {
                        create: order_items, 
                    },
                },
                include: {
                    order_items: {
                        include: {
                            product: {
                                select: { product_name: true }
                            },
                        },
                    },
                },
            });
        });

        return {
            order_id: order.id,
            items: order.order_items.map(item => ({
                product_name: item.product.product_name,
                quantity: item.quantity,
            })),
        };
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

    async getAllOrders(dto: ViewOrderDto): Promise<OrderResponseDto[]> {
        const orders = await this.prisma.orders.findMany({
            where: {
                AND: [
                    {
                        user_id: dto.user_id,
                        order_status: dto.status,
                    },
                ],

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