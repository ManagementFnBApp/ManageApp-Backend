import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { OrderDto, OrderResponseDto, ViewOrderDto } from "src/dtos/oder.dto";
import { OrderStatus } from "src/global/globalEnum";
import { ProductService } from "../products/product.service";
const POINTS_PER_VND = 10_000;

@Injectable()
export class OrderService {
    constructor(
        private prisma: PrismaService,
        private productsService: ProductService
    ) { }

    async createOrder(data: OrderDto, user_id: number): Promise<any> {
        const { order_items, ...orderInfo } = data;

        // Validate shift tồn tại trước khi vào transaction (tránh P2003 + P2028)
        const shift = await this.prisma.shift.findUnique({
            where: { id: orderInfo.shiftId },
        });
        if (!shift) {
            throw new NotFoundException(`Shift with ID ${orderInfo.shiftId} not found`);
        }

        // 1. Lấy danh sách ID sản phẩm để kiểm tra
        const productIds = order_items.map(item => item.product_id);

        const order = await this.prisma.$transaction(async (prismaTx) => {
            // Kiểm tra sự tồn tại của sản phẩm trong cùng transaction để tránh race condition
            const existingProducts = await prismaTx.product.findMany({
                where: {
                    id: { in: productIds },
                },
                select: { id: true },
            });

            if (existingProducts.length !== productIds.length) {
                throw new Error("One or more products do not exist");
            }
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
        }, { timeout: 15000 }); // tăng timeout lên 15s tránh P2028

        return {
            id: order.id,
            items: order.order_items.map(item => ({
                product_name: item.product.product_name,
                quantity: item.quantity,
            })),
        };
    }

    async updateOrder(id: number, data: OrderDto, userId: number): Promise<any> {
        const { order_items, ...orderInfo } = data;

        const order = await this.prisma.$transaction(async (prismaTx) => {
            const existingOrder = await prismaTx.orders.findUnique({
                where: { id: Number(id) }
            });

            // Validate that all products exist
            const productIds = order_items.map(item => item.product_id);
            const existingProducts = await prismaTx.product.findMany({
                where: {
                    id: { in: productIds },
                },
                select: { id: true },
            });

            if (existingProducts.length !== productIds.length) {
                throw new Error("One or more products do not exist");
            }

            // Delete existing order items
            await prismaTx.orderItem.deleteMany({
                where: { order_id: Number(id) }
            });

            // Update order and create new order items
            return prismaTx.orders.update({
                where: { id: Number(id) },
                data: {
                    shift_id: orderInfo.shiftId,
                    user_id: userId,
                    customer_id: orderInfo.customerId,
                    total_amount: orderInfo.totalAmount,
                    order_status: OrderStatus.PENDING,
                    notes: orderInfo.note || null,
                    completed_at: existingOrder?.completed_at || null,
                    cancelled_at: existingOrder?.cancelled_at || null,
                    order_items: {
                        create: order_items,
                    }
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
            id: order.id,
            items: order.order_items.map(item => ({
                product_name: item.product.product_name,
                quantity: item.quantity,
            })),
        };
    }

    async completeOrder(id: number): Promise<OrderResponseDto> {
        const order = await this.prisma.$transaction(async (tx) => {
            const updatedOrder = await tx.orders.update({
                where: { id: Number(id) },
                data: {
                    order_status: OrderStatus.COMPLETED,
                    completed_at: new Date(),
                },
            });

            // Tích điểm: chỉ khi đơn hàng có customer
            if (updatedOrder.customer_id) {
                const points = Math.floor(Number(updatedOrder.total_amount) / POINTS_PER_VND);
                if (points > 0) {
                    await tx.customer.update({
                        where: { id: updatedOrder.customer_id },
                        data: { loyalty_point: { increment: points } },
                    });
                }
            }

            return updatedOrder;
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

    async getAllOrders(dto: ViewOrderDto, user_id: number): Promise<any[]> {
        const orders = await this.prisma.orders.findMany({
            where: {
                user_id: user_id,
                ...(dto.status ? { order_status: dto.status } : {}),
            },
            include: {
                order_items: {
                    include: {
                        product: {
                            select: { product_name: true },
                        },
                    },
                },
            },
        });
        return orders.map(order => ({
            ...this.transformToDto(order),
            order_items: order.order_items.map(item => ({
                ...item,
                unit_price: Number(item.unit_price),
            })),
        }));
    }

    transformToDto(order: any): OrderResponseDto {
        return {
            id: order.id,
            customerId: order.customer_id,
            userId: order.user_id,
            shiftId: order.shift_id,
            note: order.notes || null,
            totalAmount: Number(order.total_amount),
            orderStatus: order.order_status,
            createdAt: order.created_at?.toISOString() || null,
            completedAt: order.completed_at || null,
            cancelledAt: order.cancelled_at || null
        };
    }
}