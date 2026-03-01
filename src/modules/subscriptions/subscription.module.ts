import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { SubscriptionCronService } from './subscription.cron';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ShopModule } from '../shops/shop.module';
import { ShopSubscriptionModule } from '../shop-subscriptions/shop-subscription.module';

@Module({
  imports: [PrismaModule, ShopModule, ShopSubscriptionModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionCronService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
