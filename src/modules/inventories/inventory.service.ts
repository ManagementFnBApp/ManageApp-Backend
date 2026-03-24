import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
  InventoryResponseDto,
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  InventoryItemResponseDto,
  DecreaseItemDto,
} from '../../dtos/inventory.dto';
import { PrismaService } from 'db/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) { }

  // ========================================
  // INVENTORY CRUD
  // ========================================

  async create(
    createInventoryDto: CreateInventoryDto,
  ): Promise<InventoryResponseDto> {
    // Check if shop exists
    const shop = await this.prisma.shop.findUnique({
      where: { id: createInventoryDto.shopId },
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
      },
    });

    return this.mapToInventoryResponseDto(inventory);
  }

  async findAll(shopId?: number): Promise<InventoryResponseDto[]> {
    const inventories = await this.prisma.inventory.findMany({
      where: shopId ? { shop_id: shopId } : undefined,
      orderBy: { update_at: 'desc' },
    });

    return inventories.map((inventory) =>
      this.mapToInventoryResponseDto(inventory),
    );
  }

  async findOne(id: number): Promise<InventoryResponseDto> {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id: id },
      include: {
        shop: true,
        inventory_items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    return this.mapToInventoryResponseDto(inventory);
  }

  async update(
    id: number,
    updateInventoryDto: UpdateInventoryDto,
  ): Promise<InventoryResponseDto> {
    // Check if inventory exists
    const existingInventory = await this.prisma.inventory.findUnique({
      where: { id: id },
    });

    if (!existingInventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    // If shop is being updated, check if it exists
    if (updateInventoryDto.shopId) {
      const shop = await this.prisma.shop.findUnique({
        where: { id: updateInventoryDto.shopId },
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
      },
    });

    return this.mapToInventoryResponseDto(inventory);
  }

  async remove(id: number): Promise<{ message: string }> {
    // Check if inventory exists
    const inventory = await this.prisma.inventory.findUnique({
      where: { id: id },
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    await this.prisma.inventory.delete({
      where: { id: id },
    });

    return { message: `Inventory with ID ${id} has been deleted` };
  }

  // ========================================
  // INVENTORY ITEM CRUD
  // ========================================

  async createItem(
    createInventoryItemDto: CreateInventoryItemDto,
  ): Promise<InventoryItemResponseDto> {
    const hasSystemProduct = createInventoryItemDto.productId != null;
    const hasShopProduct = createInventoryItemDto.shopProductId != null;

    if ((hasSystemProduct && hasShopProduct) || (!hasSystemProduct && !hasShopProduct)) {
      throw new BadRequestException(
        'Exactly one of productId or shopProductId is required',
      );
    }

    // Check if inventory exists
    const inventory = await this.prisma.inventory.findUnique({
      where: { id: createInventoryItemDto.inventoryId },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    if (hasSystemProduct) {
      const product = await this.prisma.product.findUnique({
        where: { id: createInventoryItemDto.productId },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }
    }

    if (hasShopProduct) {
      const shopProduct = await this.prisma.shopProduct.findUnique({
        where: { id: createInventoryItemDto.shopProductId },
      });

      if (!shopProduct) {
        throw new NotFoundException('Shop product not found');
      }

      if (shopProduct.shop_id !== inventory.shop_id) {
        throw new BadRequestException(
          'Shop product does not belong to this inventory shop',
        );
      }
    }

    // Check if item already exists
    const existingItem = await this.prisma.inventoryItem.findFirst({
      where: {
        inventory_id: createInventoryItemDto.inventoryId,
        product_id: hasSystemProduct ? createInventoryItemDto.productId : null,
        shop_product_id: hasShopProduct
          ? createInventoryItemDto.shopProductId
          : null,
      },
    });

    if (existingItem) {
      throw new ConflictException(
        'Inventory item for this product already exists in this inventory',
      );
    }

    const inventoryItem = await this.prisma.inventoryItem
      .create({
        data: {
          product_id: hasSystemProduct ? createInventoryItemDto.productId : null,
          shop_product_id: hasShopProduct ? createInventoryItemDto.shopProductId : null,
          inventory_id: createInventoryItemDto.inventoryId,
          quantity: createInventoryItemDto.quantity ?? 0,
          reserved_quantity: createInventoryItemDto.reservedQuantity ?? 0,
        },
      })
      .catch((error) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException(
            'Inventory item for this product already exists in this inventory',
          );
        }
        throw error;
      });

    return this.mapToInventoryItemResponseDto(inventoryItem);
  }

  async findAllItems(
    inventoryId?: number,
    productId?: number,
    shopProductId?: number,
  ): Promise<InventoryItemResponseDto[]> {
    if (productId != null && shopProductId != null) {
      throw new BadRequestException(
        'Use either productId or shopProductId filter, not both',
      );
    }

    const items = await this.prisma.inventoryItem.findMany({
      where: {
        inventory_id: inventoryId,
        product_id: productId,
        shop_product_id: shopProductId,
      },
      orderBy: { updated_at: 'desc' },
    });

    return items.map((item) => this.mapToInventoryItemResponseDto(item));
  }

  async findOneItem(id: number): Promise<InventoryItemResponseDto> {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: id },
      include: {
        product: true,
        inventory: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }

    return this.mapToInventoryItemResponseDto(item);
  }

  async updateItem(
    id: number,
    updateInventoryItemDto: UpdateInventoryItemDto,
  ): Promise<InventoryItemResponseDto> {
    // Check if item exists
    const existingItem = await this.prisma.inventoryItem.findUnique({
      where: { id: id },
    });

    if (!existingItem) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }

    if (
      updateInventoryItemDto.productId != null &&
      updateInventoryItemDto.shopProductId != null
    ) {
      throw new BadRequestException(
        'Provide only one of productId or shopProductId',
      );
    }

    const targetInventoryId =
      updateInventoryItemDto.inventoryId ?? existingItem.inventory_id;
    const targetInventory = await this.prisma.inventory.findUnique({
      where: { id: targetInventoryId },
    });

    if (!targetInventory) {
      throw new NotFoundException('Inventory not found');
    }

    let nextProductId: number | null = existingItem.product_id;
    let nextShopProductId: number | null = existingItem.shop_product_id;

    if (updateInventoryItemDto.productId != null) {
      const product = await this.prisma.product.findUnique({
        where: { id: updateInventoryItemDto.productId },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      nextProductId = updateInventoryItemDto.productId;
      nextShopProductId = null;
    }

    if (updateInventoryItemDto.shopProductId != null) {
      const shopProduct = await this.prisma.shopProduct.findUnique({
        where: { id: updateInventoryItemDto.shopProductId },
      });
      if (!shopProduct) {
        throw new NotFoundException('Shop product not found');
      }
      if (shopProduct.shop_id !== targetInventory.shop_id) {
        throw new BadRequestException(
          'Shop product does not belong to this inventory shop',
        );
      }
      nextShopProductId = updateInventoryItemDto.shopProductId;
      nextProductId = null;
    }

    const duplicate = await this.prisma.inventoryItem.findFirst({
      where: {
        id: { not: id },
        inventory_id: targetInventoryId,
        product_id: nextProductId,
        shop_product_id: nextShopProductId,
      },
    });

    if (duplicate) {
      throw new ConflictException(
        'Inventory item for this product already exists in this inventory',
      );
    }

    const item = await this.prisma.inventoryItem
      .update({
        where: { id: id },
        data: {
          product_id: nextProductId,
          shop_product_id: nextShopProductId,
          inventory_id: targetInventoryId,
          quantity: updateInventoryItemDto.quantity,
          reserved_quantity: updateInventoryItemDto.reservedQuantity,
        },
      })
      .catch((error) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException(
            'Inventory item for this product already exists in this inventory',
          );
        }
        throw error;
      });

    return this.mapToInventoryItemResponseDto(item);
  }

  async removeItem(id: number): Promise<{ message: string }> {
    // Check if item exists
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: id },
    });

    if (!item) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }

    await this.prisma.inventoryItem.delete({
      where: { id: id },
    });

    return { message: `Inventory item with ID ${id} has been deleted` };
  }

  async decreaseItem(dto: DecreaseItemDto): Promise<void> {
    const hasProduct = dto.product_id != null;
    const hasShopProduct = dto.shop_product_id != null;

    if ((hasProduct && hasShopProduct) || (!hasProduct && !hasShopProduct)) {
      throw new BadRequestException(
        'Provide exactly one of product',
      );
    }

    if (!dto.quantity || dto.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero');
    }

    await this.prisma.$transaction(async (prismaTx) => {
      const inventories = await prismaTx.inventory.findMany({
        where: { shop_id: dto.shop_id },
        orderBy: { update_at: 'asc' },
      });

      let remaining = dto.quantity;

      for (const inventory of inventories) {
        if (remaining <= 0) {
          break;
        }

        const inventoryItem = await prismaTx.inventoryItem.findFirst({
          where: {
            inventory_id: inventory.id,
            product_id: hasProduct ? dto.product_id : null,
            shop_product_id: hasShopProduct ? dto.shop_product_id : null,
          },
        });

        if (!inventoryItem || inventoryItem.quantity <= 0) {
          continue;
        }

        const deduct = Math.min(inventoryItem.quantity, remaining);
        remaining -= deduct;

        await prismaTx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: { quantity: inventoryItem.quantity - deduct },
        });
      }

      if (remaining > 0) {
        throw new BadRequestException(
          'Insufficient inventory quantity to fulfill the decrease',
        );
      }
    });
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
    const hasSystemProduct =
      item.product_id !== null && item.product_id !== undefined;
    const hasShopProduct =
      item.shop_product_id !== null && item.shop_product_id !== undefined;

    let productType: InventoryItemResponseDto['productType'];

    if (hasSystemProduct && !hasShopProduct) {
      productType = 'SYSTEM';
    } else if (!hasSystemProduct && hasShopProduct) {
      productType = 'SHOP';
    } else {
      // Both identifiers set or both missing: invalid state
      throw new BadRequestException(
        'Inventory item must have exactly one of product_id or shop_product_id defined',
      );
    }

    return {
      inventoryItemId: item.id,
      productId: item.product_id,
      shopProductId: item.shop_product_id,
      productType,
      inventoryId: item.inventory_id,
      quantity: item.quantity,
      reservedQuantity: item.reserved_quantity,
      updatedAt: item.updated_at,
    };
  }
}
