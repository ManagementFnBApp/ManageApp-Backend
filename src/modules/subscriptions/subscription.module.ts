import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { SubscriptionCronService } from './subscription.cron';
import { PrismaModule } from '../../../prisma/prisma.module';
import { TenantModule } from '../tenants/tenant.module';
import { RoleModule } from '../roles/role.module';
import { AdminModule } from '../admins/admin.module';

@Module({
  imports: [PrismaModule, TenantModule, RoleModule, AdminModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionCronService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
