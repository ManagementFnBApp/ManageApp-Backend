import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { ProductModule } from '../products/product.module';
import { PrismaModule } from 'db/prisma.module';
import { InventoryModule } from '../inventories/inventory.module';

@Module({
  imports: [PrismaModule, ProductModule, InventoryModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
