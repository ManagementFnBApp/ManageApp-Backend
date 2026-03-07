import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from "db/prisma.service";
import {
  CreateRedemptionDto,
  RedemptionHistoryDto,
  RedemptionResponseDto,
} from 'src/dtos/merchandise-redemption.dto';

@Injectable()
export class MerchandiseRedemptionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Đổi quà: trừ điểm customer & trừ tồn kho merchandise trong 1 transaction.
   */
  async redeemMerchandise(
    dto: CreateRedemptionDto,
    shop_id: number,
  ): Promise<RedemptionResponseDto> {
    // 1. Kiểm tra customer thuộc shop
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customer_id, shop_id },
    });

    if (!customer) {
      throw new NotFoundException(
        `Customer with ID ${dto.customer_id} not found in this shop`,
      );
    }

    // 2. Kiểm tra merchandise
    const merchandise = await this.prisma.merchandise.findFirst({
      where: { id: dto.merchandise_id, shop_id },
    });

    if (!merchandise) {
      throw new NotFoundException(
        `Merchandise with ID ${dto.merchandise_id} not found in this shop`,
      );
    }

    if (!merchandise.is_active) {
      throw new BadRequestException(
        `Merchandise "${merchandise.merchandise_name}" is no longer available`,
      );
    }

    if (merchandise.total_quantity <= 0) {
      throw new BadRequestException(
        `Merchandise "${merchandise.merchandise_name}" is out of stock`,
      );
    }

    // 3. Kiểm tra điểm
    const currentPoints = customer.loyalty_point ?? 0;
    if (currentPoints < merchandise.point_required) {
      throw new BadRequestException(
        `Insufficient loyalty points. Required: ${merchandise.point_required}, Available: ${currentPoints}`,
      );
    }

    // 4. Thực hiện trong transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Tạo redemption record
      const redemption = await tx.merchandiseRedemption.create({
        data: {
          customer_id: dto.customer_id,
          merchandise_id: dto.merchandise_id,
          shop_id,
          point_spent: merchandise.point_required,
        },
      });

      // Trừ điểm customer một cách điều kiện để tránh race condition
      const customerUpdateResult = await tx.customer.updateMany({
        where: {
          id: dto.customer_id,
          shop_id,
          loyalty_point: {
            gte: merchandise.point_required,
          },
        },
        data: {
          loyalty_point: {
            decrement: merchandise.point_required,
          },
        },
      });

      if (customerUpdateResult.count !== 1) {
        // Có thể đã bị trừ điểm bởi transaction khác -> không còn đủ điểm
        throw new BadRequestException(
          `Insufficient loyalty points to redeem this merchandise`,
        );
      }

      // Trừ tồn kho merchandise một cách điều kiện để tránh race condition
      const merchandiseUpdateResult = await tx.merchandise.updateMany({
        where: {
          id: dto.merchandise_id,
          shop_id,
          total_quantity: {
            gt: 0,
          },
        },
        data: {
          total_quantity: {
            decrement: 1,
          },
        },
      });

      if (merchandiseUpdateResult.count !== 1) {
        // Hết hàng do transaction khác vừa mua
        throw new BadRequestException(
          `Merchandise "${merchandise.merchandise_name}" is out of stock`,
        );
      }

      // Lấy lại thông tin customer sau khi trừ điểm để trả về remaining_points
      const updatedCustomer = await tx.customer.findUnique({
        where: { id: dto.customer_id },
      });

      const remaining_points = updatedCustomer?.loyalty_point ?? 0;

      return { redemption, remaining_points };
    });

    return {
      id: result.redemption.id,
      customer_id: result.redemption.customer_id,
      merchandise_id: result.redemption.merchandise_id,
      shop_id: result.redemption.shop_id,
      point_spent: result.redemption.point_spent,
      remaining_points: result.remaining_points,
      redemption_date: result.redemption.redemption_date.toISOString(),
    };
  }

  /**
   * Lịch sử đổi quà của toàn shop.
   */
  async getShopRedemptionHistory(
    shop_id: number,
  ): Promise<RedemptionHistoryDto[]> {
    const records = await this.prisma.merchandiseRedemption.findMany({
      where: { shop_id },
      orderBy: { redemption_date: 'desc' },
      include: {
        customer: { select: { full_name: true } },
        merchandise: { select: { merchandise_name: true } },
      },
    });

    return records.map((r) => this.transformToHistoryDto(r));
  }

  /**
   * Lịch sử đổi quà của 1 khách hàng cụ thể.
   */
  async getCustomerRedemptionHistory(
    customer_id: number,
    shop_id: number,
  ): Promise<RedemptionHistoryDto[]> {
    // Xác nhận customer thuộc shop trước
    const customer = await this.prisma.customer.findFirst({
      where: { id: Number(customer_id), shop_id },
    });

    if (!customer) {
      throw new NotFoundException(
        `Customer with ID ${customer_id} not found in this shop`,
      );
    }

    const records = await this.prisma.merchandiseRedemption.findMany({
      where: { customer_id: Number(customer_id), shop_id },
      orderBy: { redemption_date: 'desc' },
      include: {
        customer: { select: { full_name: true } },
        merchandise: { select: { merchandise_name: true } },
      },
    });

    return records.map((r) => this.transformToHistoryDto(r));
  }

  private transformToHistoryDto(record: any): RedemptionHistoryDto {
    return {
      id: record.id,
      customer_id: record.customer_id,
      customer_name: record.customer?.full_name ?? null,
      merchandise_id: record.merchandise_id,
      merchandise_name: record.merchandise?.merchandise_name ?? '',
      shop_id: record.shop_id,
      point_spent: record.point_spent,
      redemption_date: record.redemption_date.toISOString(),
    };
  }
}
