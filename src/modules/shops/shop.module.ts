import { Module } from '@nestjs/common';
import { ShopService } from './shop.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ShopService],
  exports: [ShopService],
})
export class ShopModule {}
