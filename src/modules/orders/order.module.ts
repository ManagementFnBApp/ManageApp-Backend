import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { ProductModule } from '../products/product.module';
import { PrismaModule } from 'db/prisma.module';
import { InventoryModule } from '../inventories/inventory.module';
import { PayosModule } from '../payos/payos.module';
import { KmsEncryptionModule } from '../kms/kms-encryption.module';

@Module({
  imports: [PrismaModule, ProductModule, InventoryModule, PayosModule, KmsEncryptionModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
