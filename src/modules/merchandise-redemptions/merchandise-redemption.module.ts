import { Module } from '@nestjs/common';
import { MerchandiseRedemptionController } from './merchandise-redemption.controller';
import { MerchandiseRedemptionService } from './merchandise-redemption.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MerchandiseRedemptionController],
  providers: [MerchandiseRedemptionService],
  exports: [MerchandiseRedemptionService],
})
export class MerchandiseRedemptionModule {}
