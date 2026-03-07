import { Module } from '@nestjs/common';
import { ShopSubscriptionService } from './shop-subscription.service';
import { RoleModule } from '../roles/role.module';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from 'db/prisma.module';

@Module({
  imports: [PrismaModule, RoleModule, EmailModule],
  providers: [ShopSubscriptionService],
  exports: [ShopSubscriptionService],
})
export class ShopSubscriptionModule {}
