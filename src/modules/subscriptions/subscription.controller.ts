import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { Public, AdminOnly } from '../../decorators/decorators';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionResponseDto,
  CreateSubscriptionShopDto,
  SubscriptionShopResponseDto,
  CreateSubscriptionPaymentDto,
  SubscriptionPaymentResponseDto,
} from '../../dtos/subscription.dto';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // ==================== SUBSCRIPTION ENDPOINTS ====================
  // Chỉ ADMIN mới được tạo/sửa/xóa subscription packages

  @Post()
  @AdminOnly() // Cần role ADMIN
  @ApiOperation({ summary: 'Tạo gói subscription mới (Chỉ Admin)' })
  @ApiResponse({ status: 201, description: 'Tạo subscription thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền ADMIN' })
  async createSubscription(@Body() dto: CreateSubscriptionDto): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.createSubscription(dto);
  }

  @Get()
  @Public() // Không cần login - public cho mọi người xem
  @ApiOperation({ summary: 'Lấy tất cả các gói subscription (Public)' })
  @ApiResponse({ status: 200, description: 'Danh sách subscriptions' })
  async getAllSubscriptions(): Promise<SubscriptionResponseDto[]> {
    return this.subscriptionService.getAllSubscriptions();
  }

  @Put(':id')
  @AdminOnly() // Cần role ADMIN
  @ApiOperation({ summary: 'Cập nhật gói subscription (Chỉ Admin)' })
  @ApiResponse({ status: 200, description: 'Cập nhật subscription thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền ADMIN' })
  @ApiResponse({ status: 404, description: 'Subscription không tồn tại' })
  async updateSubscription(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.updateSubscription(id, dto);
  }

  @Delete(':id')
  @AdminOnly() // Cần role ADMIN
  @ApiOperation({ summary: 'Xóa gói subscription (Chỉ Admin)' })
  @ApiResponse({ status: 200, description: 'Xóa subscription thành công' })
  @ApiResponse({ status: 400, description: 'Không thể xóa vì đang có shop sử dụng' })
  @ApiResponse({ status: 403, description: 'Không có quyền ADMIN' })
  @ApiResponse({ status: 404, description: 'Subscription không tồn tại' })
  async deleteSubscription(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.subscriptionService.deleteSubscription(id);
  }

  // ==================== SHOP SUBSCRIPTION ENDPOINTS ====================
  // User đã login có thể đăng ký gói subscription

  @Post('shops')
  // Không có @Public() => Cần login (AuthGuard check JWT)
  @ApiOperation({ 
    summary: 'Đăng ký gói subscription (Tạo shop) - Cần login',
    description: 'User đã login chọn gói subscription và đặt tên shop. Response trả về thông tin price để thanh toán ở bước tiếp theo.'
  })
  @ApiResponse({ status: 201, description: 'Tạo shop subscription thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async createSubscriptionShop(
    @Body() dto: CreateSubscriptionShopDto,
    @Request() req: any,
  ): Promise<SubscriptionShopResponseDto> {
    const userId = req.user?.sub || req.user?.userId; // Thử cả sub và userId
    console.log('User từ token:', req.user);
    console.log('UserId:', userId);
    
    if (!userId) {
      throw new UnauthorizedException('Không tìm thấy userId trong token. Vui lòng đăng nhập lại.');
    }
    
    return this.subscriptionService.createSubscriptionShop(dto, userId);
  }

  // ==================== SUBSCRIPTION PAYMENT ENDPOINTS ====================
  // User đã login có thể tạo payment và confirm payment

  @Post('payments')
  // Không có @Public() => Cần login (AuthGuard check JWT)
  @ApiOperation({ 
    summary: 'Tạo payment cho subscription - Cần login',
    description: 'Tạo payment cho shop subscription với status tự động là "pending". Amount PHẢI BẰNG với price của subscription package. Để kích hoạt shop và assign role SHOPOWNER, cần confirm payment ở endpoint tiếp theo.'
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
  // Không có @Public() => Cần login (AuthGuard check JWT)
  @ApiOperation({ 
    summary: 'Confirm thanh toán thành công - Cần login',
    description: 'Tự động update payment status từ "pending" thành "success". Hệ thống sẽ tự động:\n1. Kích hoạt shop (is_active = true)\n2. Gán role SHOPOWNER cho user\n3. Gán shop_id cho user\n\nKhông cần body request.'
  })
  @ApiResponse({ status: 200, description: 'Confirm payment thành công. User đã được gán role SHOPOWNER.' })
  @ApiResponse({ status: 400, description: 'Payment không ở trạng thái pending' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Payment không tồn tại' })
  async updatePaymentStatus(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SubscriptionPaymentResponseDto> {
    return this.subscriptionService.updateSubscriptionPaymentStatus(id);
  }

  // ==================== MAINTENANCE ENDPOINTS (for CronJob or Manual) ====================

  @Post('maintenance/check-expired')
  @AdminOnly()
  @ApiOperation({ 
    summary: 'Kiểm tra và cập nhật các shop subscription đã hết hạn (Admin hoặc CronJob)',
    description: 'Tự động set is_expired = true cho các shop có end_date <= now'
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