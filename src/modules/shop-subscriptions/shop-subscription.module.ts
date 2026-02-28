import { Module } from '@nestjs/common';
import { ShopSubscriptionService } from './shop-subscription.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { RoleModule } from '../roles/role.module';

@Module({
  imports: [PrismaModule, RoleModule],
  providers: [ShopSubscriptionService],
  exports: [ShopSubscriptionService],
})
export class ShopSubscriptionModule {}
