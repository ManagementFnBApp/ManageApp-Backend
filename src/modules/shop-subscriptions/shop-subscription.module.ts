import { Module } from '@nestjs/common';
import { ShopSubscriptionService } from './shop-subscription.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { RoleModule } from '../roles/role.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, RoleModule, EmailModule],
  providers: [ShopSubscriptionService],
  exports: [ShopSubscriptionService],
})
export class ShopSubscriptionModule {}
