import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import {
    CreateInventoryDto,
    UpdateInventoryDto,
    InventoryResponseDto,
    CreateInventoryItemDto,
    UpdateInventoryItemDto,
    InventoryItemResponseDto
} from '../../dtos/inventory.dto';
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class InventoryService {
    constructor(private prisma: PrismaService) { }

    // ========================================
    // INVENTORY CRUD
    // ========================================

    async create(createInventoryDto: CreateInventoryDto): Promise<InventoryResponseDto> {
        // Check if shop exists
        const shop = await this.prisma.shop.findUnique({
            where: { id: createInventoryDto.shopId }
        });

        if (!shop) {
            throw new NotFoundException('Shop not found');
        }

        const inventory = await this.prisma.inventory.create({
            data: {
                shop_id: createInventoryDto.shopId,
                current_quantity: createInventoryDto.currentQuantity ?? 0,
                minimum_threshold: createInventoryDto.minimumThreshold,
                reorder_quantity: createInventoryDto.reorderQuantity,
            }
        });

        return this.mapToInventoryResponseDto(inventory);
    }

    async findAll(shopId?: number): Promise<InventoryResponseDto[]> {
        const inventories = await this.prisma.inventory.findMany({
            where: shopId ? { shop_id: shopId } : undefined,
            orderBy: { update_at: 'desc' }
        });

        return inventories.map(inventory => this.mapToInventoryResponseDto(inventory));
    }

    async findOne(id: number): Promise<InventoryResponseDto> {
        const inventory = await this.prisma.inventory.findUnique({
            where: { id: id },
            include: {
                shop: true,
                inventory_items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!inventory) {
            throw new NotFoundException(`Inventory with ID ${id} not found`);
        }

        return this.mapToInventoryResponseDto(inventory);
    }

    async update(id: number, updateInventoryDto: UpdateInventoryDto): Promise<InventoryResponseDto> {
        // Check if inventory exists
        const existingInventory = await this.prisma.inventory.findUnique({
            where: { id: id }
        });

        if (!existingInventory) {
            throw new NotFoundException(`Inventory with ID ${id} not found`);
        }

        // If shop is being updated, check if it exists
        if (updateInventoryDto.shopId) {
            const shop = await this.prisma.shop.findUnique({
                where: { id: updateInventoryDto.shopId }
            });

            if (!shop) {
                throw new NotFoundException('Shop not found');
            }
        }

        const inventory = await this.prisma.inventory.update({
            where: { id: id },
            data: {
                shop_id: updateInventoryDto.shopId,
                current_quantity: updateInventoryDto.currentQuantity,
                minimum_threshold: updateInventoryDto.minimumThreshold,
                reorder_quantity: updateInventoryDto.reorderQuantity,
                last_restock_at: updateInventoryDto.lastRestockAt,
            }
        });

        return this.mapToInventoryResponseDto(inventory);
    }

    async remove(id: number): Promise<{ message: string }> {
        // Check if inventory exists
        const inventory = await this.prisma.inventory.findUnique({
            where: { id: id }
        });

        if (!inventory) {
            throw new NotFoundException(`Inventory with ID ${id} not found`);
        }

        await this.prisma.inventory.delete({
            where: { id: id }
        });

        return { message: `Inventory with ID ${id} has been deleted` };
    }

    // ========================================
    // INVENTORY ITEM CRUD
    // ========================================

    async createItem(createInventoryItemDto: CreateInventoryItemDto): Promise<InventoryItemResponseDto> {
        // Check if product exists
        const product = await this.prisma.product.findUnique({
            where: { id: createInventoryItemDto.productId }
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        // Check if inventory exists
        const inventory = await this.prisma.inventory.findUnique({
            where: { id: createInventoryItemDto.inventoryId }
        });

        if (!inventory) {
            throw new NotFoundException('Inventory not found');
        }

        // Check if item already exists
        const existingItem = await this.prisma.inventoryItem.findFirst({
            where: {
                product_id: createInventoryItemDto.productId,
                inventory_id: createInventoryItemDto.inventoryId
            }
        });

        if (existingItem) {
            throw new ConflictException('Inventory item for this product already exists in this inventory');
        }

        const inventoryItem = await this.prisma.inventoryItem.create({
            data: {
                product_id: createInventoryItemDto.productId,
                inventory_id: createInventoryItemDto.inventoryId,
                quantity: createInventoryItemDto.quantity ?? 0,
                reserved_quantity: createInventoryItemDto.reservedQuantity ?? 0,
            }
        });

        return this.mapToInventoryItemResponseDto(inventoryItem);
    }

    async findAllItems(inventoryId?: number, productId?: number): Promise<InventoryItemResponseDto[]> {
        const items = await this.prisma.inventoryItem.findMany({
            where: {
                inventory_id: inventoryId,
                product_id: productId,
            },
            orderBy: { updated_at: 'desc' }
        });

        return items.map(item => this.mapToInventoryItemResponseDto(item));
    }

    async findOneItem(id: number): Promise<InventoryItemResponseDto> {
        const item = await this.prisma.inventoryItem.findUnique({
            where: { id: id },
            include: {
                product: true,
                inventory: true
            }
        });

        if (!item) {
            throw new NotFoundException(`Inventory item with ID ${id} not found`);
        }

        return this.mapToInventoryItemResponseDto(item);
    }

    async updateItem(id: number, updateInventoryItemDto: UpdateInventoryItemDto): Promise<InventoryItemResponseDto> {
        // Check if item exists
        const existingItem = await this.prisma.inventoryItem.findUnique({
            where: { id: id }
        });

        if (!existingItem) {
            throw new NotFoundException(`Inventory item with ID ${id} not found`);
        }

        const item = await this.prisma.inventoryItem.update({
            where: { id: id },
            data: {
                product_id: updateInventoryItemDto.productId,
                inventory_id: updateInventoryItemDto.inventoryId,
                quantity: updateInventoryItemDto.quantity,
                reserved_quantity: updateInventoryItemDto.reservedQuantity,
            }
        });

        return this.mapToInventoryItemResponseDto(item);
    }

    async removeItem(id: number): Promise<{ message: string }> {
        // Check if item exists
        const item = await this.prisma.inventoryItem.findUnique({
            where: { id: id }
        });

        if (!item) {
            throw new NotFoundException(`Inventory item with ID ${id} not found`);
        }

        await this.prisma.inventoryItem.delete({
            where: { id: id }
        });

        return { message: `Inventory item with ID ${id} has been deleted` };
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    private mapToInventoryResponseDto(inventory: any): InventoryResponseDto {
        return {
            inventoryId: inventory.id,
            shopId: inventory.shop_id,
            currentQuantity: inventory.current_quantity,
            minimumThreshold: inventory.minimum_threshold,
            reorderQuantity: inventory.reorder_quantity,
            lastRestockAt: inventory.last_restock_at,
            updateAt: inventory.update_at,
        };
    }

    private mapToInventoryItemResponseDto(item: any): InventoryItemResponseDto {
        return {
            inventoryItemId: item.id,
            productId: item.product_id,
            inventoryId: item.inventory_id,
            quantity: item.quantity,
            reservedQuantity: item.reserved_quantity,
            updatedAt: item.updated_at,
        };
    }
}
