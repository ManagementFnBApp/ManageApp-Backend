import { Module } from '@nestjs/common';
import { MerchandiseController } from './merchandise.controller';
import { MerchandiseService } from './merchandise.service';
import { PrismaModule } from 'db/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MerchandiseController],
  providers: [MerchandiseService],
  exports: [MerchandiseService],
})
export class MerchandiseModule {}
