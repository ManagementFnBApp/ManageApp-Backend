import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionResponseDto,
} from '../../dtos/subscription.dto';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  // ==================== SUBSCRIPTION METHODS ====================

  async createSubscription(dto: CreateSubscriptionDto): Promise<SubscriptionResponseDto> {
    const existed = await this.prisma.subscription.findUnique({
      where: { package_code: dto.package_code },
    });

    if (existed) {
      throw new BadRequestException(`Package code ${dto.package_code} đã tồn tại`);
    }

    const subscription = await this.prisma.subscription.create({
      data: {
        package_code: dto.package_code,
        description: dto.description,
        price: dto.price,
        billing_cycle: dto.billing_cycle,
        features: dto.features,
      },
    });

    return this.transformSubscriptionToDto(subscription);
  }

  async getAllSubscriptions(): Promise<SubscriptionResponseDto[]> {
    // Chỉ lấy các subscription đang active
    const subscriptions = await this.prisma.subscription.findMany({
      where: { is_active: true },
    });
    return subscriptions.map((sub) => this.transformSubscriptionToDto(sub));
  }

  async updateSubscription(id: number, dto: UpdateSubscriptionDto): Promise<SubscriptionResponseDto> {
    // Kiểm tra subscription có tồn tại không
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { id: id },
    });

    if (!existingSubscription) {
      throw new NotFoundException(`Subscription ID ${id} không tồn tại`);
    }

    // Nếu update package_code, kiểm tra xem có trùng với subscription khác không
    if (dto.package_code && dto.package_code !== existingSubscription.package_code) {
      const duplicatePackageCode = await this.prisma.subscription.findUnique({
        where: { package_code: dto.package_code },
      });

      if (duplicatePackageCode) {
        throw new BadRequestException(`Package code ${dto.package_code} đã tồn tại`);
      }
    }

    // Update subscription
    const updatedSubscription = await this.prisma.subscription.update({
      where: { id: id },
      data: {
        package_code: dto.package_code,
        description: dto.description,
        price: dto.price,
        billing_cycle: dto.billing_cycle,
        features: dto.features,
        is_active: dto.is_active,
      },
    });

    return this.transformSubscriptionToDto(updatedSubscription);
  }

  async deleteSubscription(id: number): Promise<{ message: string }> {
    // Kiểm tra subscription có tồn tại không
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { id: id },
      include: {
        shop_subscriptions: {
          where: { is_expired: false }, // Chỉ check những shop chưa hết hạn
        },
      },
    });

    if (!existingSubscription) {
      throw new NotFoundException(`Subscription ID ${id} không tồn tại`);
    }

    // Kiểm tra xem có shop subscription nào chưa hết hạn không
    if (existingSubscription.shop_subscriptions.length > 0) {
      throw new BadRequestException(
        `Không thể xóa subscription này vì đang có ${existingSubscription.shop_subscriptions.length} shop chưa hết hạn đang sử dụng. Vui lòng chờ các shop dùng hết hạn hoặc chuyển các shop sang gói khác trước.`
      );
    }

    // Soft delete: Set is_active = false và deleted_at = now
    // Hệ thống sẽ tự động xóa hoàn toàn sau 30 ngày (cần cronjob)
    await this.prisma.subscription.update({
      where: { id: id },
      data: {
        is_active: false,
        deleted_at: new Date(),
      },
    });

    return {
      message: `Subscription ID ${id} đã được đánh dấu xóa. Sẽ tự động xóa hoàn toàn sau 30 ngày nếu không có shop nào sử dụng.`,
    };
  }

  // ==================== MAINTENANCE METHODS (for CronJob) ====================

  async deleteOldInactiveSubscriptions(): Promise<{ deleted: number; message: string }> {
    // Tìm các subscription đã bị đánh dấu xóa (is_active = false) hơn 30 ngày
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const subscriptionsToDelete = await this.prisma.subscription.findMany({
      where: {
        is_active: false,
        deleted_at: {
          lte: thirtyDaysAgo, // deleted_at <= 30 days ago
        },
      },
      include: {
        shop_subscriptions: true,
      },
    });

    // Chỉ xóa những subscription không còn shop nào sử dụng
    const safeToDelete = subscriptionsToDelete.filter(
      (sub) => sub.shop_subscriptions.length === 0
    );

    if (safeToDelete.length > 0) {
      await this.prisma.subscription.deleteMany({
        where: {
          id: {
            in: safeToDelete.map((s) => s.id),
          },
        },
      });
    }

    return {
      deleted: safeToDelete.length,
      message: `Đã xóa vĩnh viễn ${safeToDelete.length} subscription đã inactive hơn 30 ngày`,
    };
  }

  // ==================== PRIVATE HELPER METHODS ====================
  private transformSubscriptionToDto(subscription: any): SubscriptionResponseDto {
    return {
      subscription_id: subscription.id,
      package_code: subscription.package_code,
      description: subscription.description,
      price: parseFloat(subscription.price),
      billing_cycle: subscription.billing_cycle,
      features: subscription.features,
      is_active: subscription.is_active,
      created_at: subscription.created_at,
      updated_at: subscription.updated_at,
      deleted_at: subscription.deleted_at,
    };
  }
}
