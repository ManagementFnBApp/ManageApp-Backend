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
import { Roles } from 'src/decorators/decorators';
import { Role } from 'src/global/globalEnum';

@Controller('inventories')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) { }

  // ========================================
  // INVENTORY ENDPOINTS
  // ========================================

  @Roles(Role.SHOPOWNER, Role.STAFF)
  @Post()
  create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.create(createInventoryDto);
  }

  @Roles(Role.SHOPOWNER, Role.STAFF)
  @Get()
  findAll(
    @Query('shopId', new ParseIntPipe({ optional: true })) shopId?: number,
  ) {
    return this.inventoryService.findAll(shopId);
  }

  @Roles(Role.SHOPOWNER, Role.STAFF)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.findOne(id);
  }

  @Roles(Role.SHOPOWNER, Role.STAFF)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    return this.inventoryService.update(id, updateInventoryDto);
  }

  @Roles(Role.SHOPOWNER)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.remove(id);
  }

  // ========================================
  // INVENTORY ITEM ENDPOINTS
  // ========================================

  @Roles(Role.SHOPOWNER, Role.STAFF)
  @Post('items')
  createItem(@Body() createInventoryItemDto: CreateInventoryItemDto) {
    return this.inventoryService.createItem(createInventoryItemDto);
  }

  @Roles(Role.SHOPOWNER, Role.STAFF)
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

  @Roles(Role.SHOPOWNER, Role.STAFF)
  @Get('items/:id')
  findOneItem(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.findOneItem(id);
  }

  @Roles(Role.SHOPOWNER, Role.STAFF)
  @Patch('items/:id')
  updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInventoryItemDto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.updateItem(id, updateInventoryItemDto);
  }

  @Roles(Role.SHOPOWNER)
  @Delete('items/:id')
  removeItem(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.removeItem(id);
  }
}
