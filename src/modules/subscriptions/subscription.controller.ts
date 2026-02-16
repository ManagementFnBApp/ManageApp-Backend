import { Controller, Get, Post, Put, Body, Param, ParseIntPipe, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { Public, AdminOnly } from '../../decorators/decorators';
import {
  CreateSubscriptionDto,
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

  // ==================== SUBSCRIPTION TENANT ENDPOINTS ====================

  @Post('tenants')
  @ApiOperation({ summary: 'Tạo subscription tenant (đăng ký gói cho user) - Yêu cầu login' })
  @ApiResponse({ status: 201, description: 'Tạo subscription tenant thành công' })
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
    description: 'Khi payment_status là "success", hệ thống sẽ tự động tạo tenant và assign role SHOPOWNER cho user'
  })
  @ApiResponse({ status: 201, description: 'Tạo payment thành công' })
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
}
