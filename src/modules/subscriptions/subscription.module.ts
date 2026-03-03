import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { SubscriptionCronService } from './subscription.cron';
import { ShopModule } from '../shops/shop.module';
import { ShopSubscriptionModule } from '../shop-subscriptions/shop-subscription.module';
import { PrismaModule } from 'db/prisma.module';

@Module({
  imports: [PrismaModule, ShopModule, ShopSubscriptionModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionCronService],
  exports: [SubscriptionService],
})
export class SubscriptionModule { }
