import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class SubscriptionCronService {
  private readonly logger = new Logger(SubscriptionCronService.name);

  constructor(private readonly subscriptionService: SubscriptionService) {}

  // Chạy mỗi ngày lúc 00:00 (nửa đêm)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'check-expired-subscriptions',
    timeZone: 'Asia/Ho_Chi_Minh', // Múi giờ Việt Nam
  })
  async handleCheckExpiredSubscriptions() {
    this.logger.log('Bắt đầu kiểm tra subscription tenant đã hết hạn...');

    try {
      const result = await this.subscriptionService.checkAndUpdateExpiredSubscriptions();
      this.logger.log(` ${result.message}`);
    } catch (error) {
      this.logger.error('Lỗi khi kiểm tra expired subscriptions:', error);
    }
  }

  // Chạy mỗi ngày lúc 01:00 (1 giờ sáng) để cleanup
  @Cron(CronExpression.EVERY_DAY_AT_1AM, {
    name: 'cleanup-inactive-subscriptions',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleCleanupInactiveSubscriptions() {
    this.logger.log('🗑️  Bắt đầu xóa subscription đã inactive hơn 30 ngày...');

    try {
      const result = await this.subscriptionService.deleteOldInactiveSubscriptions();
      this.logger.log(` ${result.message}`);
    } catch (error) {
      this.logger.error(' Lỗi khi cleanup inactive subscriptions:', error);
    }
  }

  // Chạy mỗi giờ để xóa các tenant chưa thanh toán sau 1 giờ
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'delete-unpaid-tenants',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleDeleteUnpaidTenants() {
    this.logger.log('🗑️  Bắt đầu xóa các tenant chưa thanh toán sau 1 giờ...');

    try {
      const result = await this.subscriptionService.deleteUnpaidTenants();
      if (result.deleted > 0) {
        this.logger.log(`✅ ${result.message}`);
      }
    } catch (error) {
      this.logger.error('❌ Lỗi khi xóa unpaid tenants:', error);
    }
  }

  // Optional: Chạy mỗi giờ để check nếu muốn real-time hơn
  // @Cron(CronExpression.EVERY_HOUR, {
  //   name: 'check-expired-subscriptions-hourly',
  //   timeZone: 'Asia/Ho_Chi_Minh',
  // })
  // async handleCheckExpiredSubscriptionsHourly() {
  //   this.logger.log('🔄 Kiểm tra expired subscriptions (hourly)...');
  //   try {
  //     const result = await this.subscriptionService.checkAndUpdateExpiredSubscriptions();
  //     if (result.updated > 0) {
  //       this.logger.log(`✅ ${result.message}`);
  //     }
  //   } catch (error) {
  //     this.logger.error('❌ Lỗi:', error);
  //   }
  // }
}
