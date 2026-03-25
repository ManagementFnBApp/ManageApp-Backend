import { Module } from '@nestjs/common';
import { ShopSubscriptionService } from './shop-subscription.service';
import { RoleModule } from '../roles/role.module';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from 'db/prisma.module';
import { PayosModule } from '../payos/payos.module';

@Module({
  imports: [PrismaModule, RoleModule, EmailModule, PayosModule],
  providers: [ShopSubscriptionService],
  exports: [ShopSubscriptionService],
})
export class ShopSubscriptionModule {}
