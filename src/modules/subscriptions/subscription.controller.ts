import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { Public, AdminOnly } from '../../decorators/decorators';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionResponseDto,
  CreateSubscriptionTenantDto,
  SubscriptionTenantResponseDto,
  CreateSubscriptionPaymentDto,
  UpdateSubscriptionPaymentStatusDto,
  SubscriptionPaymentResponseDto,
} from '../../dtos/subscription.dto';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // ==================== SUBSCRIPTION ENDPOINTS ====================

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Tạo gói subscription mới (Chỉ Admin)' })
  @ApiResponse({ status: 201, description: 'Tạo subscription thành công' })
  async createSubscription(@Body() dto: CreateSubscriptionDto): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.createSubscription(dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lấy tất cả các gói subscription (Public)' })
  @ApiResponse({ status: 200, description: 'Danh sách subscriptions' })
  async getAllSubscriptions(): Promise<SubscriptionResponseDto[]> {
    return this.subscriptionService.getAllSubscriptions();
  }

  @Put(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Cập nhật gói subscription (Chỉ Admin)' })
  @ApiResponse({ status: 200, description: 'Cập nhật subscription thành công' })
  @ApiResponse({ status: 404, description: 'Subscription không tồn tại' })
  async updateSubscription(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.updateSubscription(id, dto);
  }

  @Delete(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Xóa gói subscription (Chỉ Admin)' })
  @ApiResponse({ status: 200, description: 'Xóa subscription thành công' })
  @ApiResponse({ status: 400, description: 'Không thể xóa vì đang có tenant sử dụng' })
  @ApiResponse({ status: 404, description: 'Subscription không tồn tại' })
  async deleteSubscription(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.subscriptionService.deleteSubscription(id);
  }

  // ==================== SUBSCRIPTION TENANT ENDPOINTS ====================

  @Post('tenants')
  @ApiOperation({ 
    summary: 'Tạo subscription tenant (đăng ký gói cho user) - Yêu cầu login',
    description: 'Tạo subscription tenant khi user chọn gói. Response sẽ bao gồm thông tin price để user biết số tiền cần thanh toán ở bước tiếp theo.'
  })
  @ApiResponse({ status: 201, description: 'Tạo subscription tenant thành công. Response bao gồm subscription info với price.' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async createSubscriptionTenant(
    @Body() dto: CreateSubscriptionTenantDto,
    @Request() req: any,
  ): Promise<SubscriptionTenantResponseDto> {
    const userId = req.user?.sub || req.user?.userId; // Thử cả sub và userId
    console.log('User từ token:', req.user);
    console.log('UserId:', userId);
    
    if (!userId) {
      throw new UnauthorizedException('Không tìm thấy userId trong token. Vui lòng đăng nhập lại.');
    }
    
    return this.subscriptionService.createSubscriptionTenant(dto, userId);
  }

  // ==================== SUBSCRIPTION PAYMENT ENDPOINTS ====================

  @Post('payments')
  @ApiOperation({ 
    summary: 'Tạo payment cho subscription - Yêu cầu login',
    description: 'Tạo payment cho subscription tenant. LƯU Ý: Amount PHẢI BẰNG với price của subscription package. Khi payment_status là "success", hệ thống sẽ tự động assign tenant và role SHOPOWNER cho user'
  })
  @ApiResponse({ status: 201, description: 'Tạo payment thành công' })
  @ApiResponse({ status: 400, description: 'Amount không khớp với price của subscription' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async createSubscriptionPayment(
    @Body() dto: CreateSubscriptionPaymentDto,
    @Request() req: any,
  ): Promise<SubscriptionPaymentResponseDto> {
    const userId = req.user?.sub || req.user?.userId; // Thử cả sub và userId
    console.log('User từ token:', req.user);
    console.log('UserId:', userId);
    
    if (!userId) {
      throw new UnauthorizedException('Không tìm thấy userId trong token. Vui lòng đăng nhập lại.');
    }
    
    return this.subscriptionService.createSubscriptionPayment(dto, userId);
  }

  @Put('payments/:id/status')
  @Public()
  @ApiOperation({ 
    summary: 'Cập nhật status của payment (Public - cho payment gateway webhook)',
    description: 'Khi update payment_status thành "success", hệ thống sẽ tự động tạo tenant và assign role SHOPOWNER cho user'
  })
  @ApiResponse({ status: 200, description: 'Cập nhật payment status thành công' })
  async updatePaymentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubscriptionPaymentStatusDto,
  ): Promise<SubscriptionPaymentResponseDto> {
    return this.subscriptionService.updateSubscriptionPaymentStatus(id, dto);
  }

  // ==================== MAINTENANCE ENDPOINTS (for CronJob or Manual) ====================

  @Post('maintenance/check-expired')
  @AdminOnly()
  @ApiOperation({ 
    summary: 'Kiểm tra và cập nhật các subscription tenant đã hết hạn (Admin hoặc CronJob)',
    description: 'Tự động set is_expired = true cho các tenant có end_date <= now'
  })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async checkExpiredSubscriptions(): Promise<{ updated: number; message: string }> {
    return this.subscriptionService.checkAndUpdateExpiredSubscriptions();
  }

  @Delete('maintenance/cleanup-inactive')
  @AdminOnly()
  @ApiOperation({ 
    summary: 'Xóa vĩnh viễn các subscription đã inactive hơn 30 ngày (Admin hoặc CronJob)',
    description: 'Tự động xóa các subscription có is_active = false và deleted_at > 30 ngày trước'
  })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  async cleanupInactiveSubscriptions(): Promise<{ deleted: number; message: string }> {
    return this.subscriptionService.deleteOldInactiveSubscriptions();
  }}