import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
} from '../../dtos/inventory.dto';

@Controller('inventories')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ========================================
  // INVENTORY ENDPOINTS
  // ========================================

  @Post()
  create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.create(createInventoryDto);
  }

  @Get()
  findAll(
    @Query('shopId', new ParseIntPipe({ optional: true })) shopId?: number,
  ) {
    return this.inventoryService.findAll(shopId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    return this.inventoryService.update(id, updateInventoryDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.remove(id);
  }

  // ========================================
  // INVENTORY ITEM ENDPOINTS
  // ========================================

  @Post('items')
  createItem(@Body() createInventoryItemDto: CreateInventoryItemDto) {
    return this.inventoryService.createItem(createInventoryItemDto);
  }

  @Get('items/all')
  findAllItems(
    @Query('inventoryId', new ParseIntPipe({ optional: true }))
    inventoryId?: number,
    @Query('productId', new ParseIntPipe({ optional: true }))
    productId?: number,
    @Query('shopProductId', new ParseIntPipe({ optional: true }))
    shopProductId?: number,
  ) {
    return this.inventoryService.findAllItems(
      inventoryId,
      productId,
      shopProductId,
    );
  }

  @Get('items/:id')
  findOneItem(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.findOneItem(id);
  }

  @Patch('items/:id')
  updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInventoryItemDto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.updateItem(id, updateInventoryItemDto);
  }

  @Delete('items/:id')
  removeItem(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.removeItem(id);
  }
}
