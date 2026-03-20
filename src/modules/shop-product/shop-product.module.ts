import { Module } from '@nestjs/common';
import { ShopProductService } from './shop-product.service';
import { ShopProductController } from './shop-product.controller';
import { PrismaModule } from 'db/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ShopProductController],
  providers: [ShopProductService],
})
export class ShopProductModule {}
