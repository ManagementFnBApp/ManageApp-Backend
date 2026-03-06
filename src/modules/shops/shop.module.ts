import { Module } from '@nestjs/common';
import { ShopService } from './shop.service';
import { PrismaModule } from 'db/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ShopService],
  exports: [ShopService],
})
export class ShopModule { }
