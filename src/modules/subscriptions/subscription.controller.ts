import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  UnauthorizedException,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { type Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { SubscriptionService } from './subscription.service';
import { ShopSubscriptionService } from '../shop-subscriptions/shop-subscription.service';
import { Public, Roles } from '../../decorators/decorators';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionResponseDto,
  CreateSubscriptionShopDto,
  SubscriptionShopResponseDto,
  CreateSubscriptionPaymentDto,
  SubscriptionPaymentResponseDto,
  RenewSubscriptionPaymentDto,
  CreatePayosSubscriptionPaymentDto,
  PayosPaymentResponseDto,
  SubscriptionMonthReportDto,
  SubscriptionReportDto,
} from '../../dtos/subscription.dto';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
export   class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly shopSubscriptionService: ShopSubscriptionService,
    private readonly configService: ConfigService,
  ) { }

  // ==================== SUBSCRIPTION ENDPOINTS ====================
  // Chỉ ADMIN mới được tạo/sửa/xóa subscription packages

  @Post()
  @Roles('ADMIN') // Cần role ADMIN
  @ApiOperation({ summary: 'Tạo gói subscription mới (Chỉ Admin)' })
  @ApiResponse({ status: 201, description: 'Tạo subscription thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền ADMIN' })
  async createSubscription(
    @Body() dto: CreateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
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
  @Roles('ADMIN') // Cần role ADMIN
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
  @Roles('ADMIN') // Cần role ADMIN
  @ApiOperation({ summary: 'Xóa gói subscription (Chỉ Admin)' })
  @ApiResponse({ status: 200, description: 'Xóa subscription thành công' })
  @ApiResponse({
    status: 400,
    description: 'Không thể xóa vì đang có shop sử dụng',
  })
  @ApiResponse({ status: 403, description: 'Không có quyền ADMIN' })
  @ApiResponse({ status: 404, description: 'Subscription không tồn tại' })
  async deleteSubscription(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    return this.subscriptionService.deleteSubscription(id);
  }

  @Post('report')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Báo cáo doanh thu subscription theo tháng (Chỉ Admin)',
    description:
      'Cộng tổng các payment subscription có trạng thái success trong tháng và trả về thống kê theo từng ngày (fill đủ ngày trong tháng).',
  })
  @ApiResponse({ status: 200, description: 'Lấy báo cáo thành công' })
  async subscriptionReport(
    @Body() dto: SubscriptionMonthReportDto,
  ): Promise<SubscriptionReportDto> {
    return this.subscriptionService.subscriptionReport(dto);
  }

  // ==================== SHOP SUBSCRIPTION ENDPOINTS ====================
  // User đã login có thể đăng ký gói subscription

  @Post('shops')
  // Không có @Public() => Cần login (AuthGuard check JWT)
  @ApiOperation({
    summary: 'Đăng ký gói subscription (Tạo shop) - Cần login',
    description:
      'User đã login chọn gói subscription và đặt tên shop. Response trả về thông tin price để thanh toán ở bước tiếp theo.',
  })
  @ApiResponse({ status: 201, description: 'Tạo shop subscription thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async createSubscriptionShop(
    @Body() dto: CreateSubscriptionShopDto,
    @Request() req: any,
  ): Promise<SubscriptionShopResponseDto> {
    const userId = req.user?.id; // Thử cả sub và userId

    if (!userId) {
      throw new UnauthorizedException(
        'Không tìm thấy userId trong token. Vui lòng đăng nhập lại.',
      );
    }

    return this.shopSubscriptionService.createSubscriptionShop(dto, userId);
  }

  // ==================== SUBSCRIPTION PAYMENT ENDPOINTS ====================
  // User đã login có thể tạo payment và confirm payment

  @Post('payments')
  // Không có @Public() => Cần login (AuthGuard check JWT)
  @ApiOperation({
    summary: 'Tạo payment cho subscription - Cần login',
    description:
      'Tạo payment cho shop subscription với status tự động là "pending". Amount PHẢI BẰNG với price của subscription package. Để kích hoạt shop và assign role SHOPOWNER, cần confirm payment ở endpoint tiếp theo.',
  })
  @ApiResponse({ status: 201, description: 'Tạo payment thành công' })
  @ApiResponse({
    status: 400,
    description: 'Amount không khớp với price của subscription',
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async createSubscriptionPayment(
    @Body() dto: CreateSubscriptionPaymentDto,
    @Request() req: any,
  ): Promise<SubscriptionPaymentResponseDto> {
    const userId = req.user?.id; // Thử cả sub và userId

    if (!userId) {
      throw new UnauthorizedException(
        'Không tìm thấy userId trong token. Vui lòng đăng nhập lại.',
      );
    }

    return this.shopSubscriptionService.createSubscriptionPayment(dto, userId);
  }

  @Put('payments/:id/status')
  // Không có @Public() => Cần login (AuthGuard check JWT)
  @ApiOperation({
    summary: 'Confirm thanh toán thành công - Cần login',
    description:
      'Tự động update payment status từ "pending" thành "success". Hệ thống sẽ tự động:\n1. Kích hoạt shop (is_active = true)\n2. Gán role SHOPOWNER cho user\n3. Gán shop_id cho user\n\nKhông cần body request.',
  })
  @ApiResponse({
    status: 200,
    description: 'Confirm payment thành công. User đã được gán role SHOPOWNER.',
  })
  @ApiResponse({
    status: 400,
    description: 'Payment không ở trạng thái pending',
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Payment không tồn tại' })
  async updatePaymentStatus(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SubscriptionPaymentResponseDto> {
    return this.shopSubscriptionService.updateSubscriptionPaymentStatus(id);
  }

  @Post('renew')
  // Cần login và phải là SHOPOWNER
  @ApiOperation({
    summary: 'Gia hạn subscription - Cần login và là SHOPOWNER',
    description:
      'Tạo payment mới để gia hạn subscription. Amount tự động lấy từ subscription package hiện tại. Khi payment status = "success" (tại endpoint confirm payment), hệ thống sẽ tự động:\n1. Tăng number_of_renewals\n2. Cập nhật end_date mới\n3. Set is_expired = false\n4. Mở lại quyền truy cập cho SHOPOWNER và STAFF',
  })
  @ApiResponse({ status: 201, description: 'Tạo renew payment thành công' })
  @ApiResponse({
    status: 400,
    description: 'Đã có payment pending hoặc user không phải SHOPOWNER',
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async renewSubscription(
    @Body() dto: RenewSubscriptionPaymentDto,
    @Request() req: any,
  ): Promise<SubscriptionPaymentResponseDto> {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException(
        'Không tìm thấy userId trong token. Vui lòng đăng nhập lại.',
      );
    }

    return this.shopSubscriptionService.renewSubscription(dto, userId);
  }

  // ==================== MAINTENANCE ENDPOINTS (for CronJob or Manual) ====================

  @Post('maintenance/check-expired')
  @Roles('ADMIN')
  @ApiOperation({
    summary:
      'Kiểm tra và cập nhật các shop subscription đã hết hạn (Admin hoặc CronJob)',
    description:
      'Tự động set is_expired = true cho các shop có end_date <= now',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async checkExpiredSubscriptions(): Promise<{
    updated: number;
    message: string;
  }> {
    return this.shopSubscriptionService.checkAndUpdateExpiredSubscriptions();
  }

  @Delete('maintenance/cleanup-inactive')
  @Roles('ADMIN')
  @ApiOperation({
    summary:
      'Xóa vĩnh viễn các subscription đã inactive hơn 30 ngày (Admin hoặc CronJob)',
    description:
      'Tự động xóa các subscription có is_active = false và deleted_at > 30 ngày trước',
  })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  async cleanupInactiveSubscriptions(): Promise<{
    deleted: number;
    message: string;
  }> {
    return this.subscriptionService.deleteOldInactiveSubscriptions();
  }

  @Delete('maintenance/cleanup-unpaid-shops')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Xóa các shop chưa thanh toán sau 1 giờ (Admin hoặc CronJob)',
    description:
      'Tự động xóa các shop có is_active = false và created_at > 1 giờ trước mà không có payment success',
  })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  async cleanupUnpaidShops(): Promise<{ deleted: number; message: string }> {
    return this.shopSubscriptionService.deleteUnpaidShops();
  }

  @Delete('maintenance/cleanup-expired-shops')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Xóa các shop đã expired hơn 14 ngày (Admin hoặc CronJob)',
    description:
      'Tự động xóa vĩnh viễn shop đã expired hơn 14 ngày cùng tất cả dữ liệu liên quan:\n- Xóa tất cả STAFF (users có owner_manager_id)\n- Xóa shop subscription và payments\n- Xóa tất cả dữ liệu shop (orders, inventory, customers, etc.)\n- Reset SHOPOWNER về trạng thái ban đầu (không shop, không role SHOPOWNER)',
  })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  async cleanupExpiredShops(): Promise<{ deleted: number; message: string }> {
    return this.shopSubscriptionService.deleteExpiredShopsAfter14Days();
  }

  // ==================== PAYOS PAYMENT ENDPOINTS ====================

  @Post('payments/payos')
  @ApiOperation({
    summary: 'Tạo thanh toán PayOS QR cho subscription - Cần login',
    description:
      'Tạo yêu cầu thanh toán PayOS cho shop subscription. Response trả về `checkoutUrl` để redirect user đến trang thanh toán PayOS (có QR code) hoặc `qrCode` để hiển thị QR code riêng. Sau khi thanh toán thành công, PayOS sẽ tự động gọi webhook để kích hoạt shop.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tạo link thanh toán PayOS thành công',
    type: PayosPaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Lỗi tạo thanh toán' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async createPayosPayment(
    @Body() dto: CreatePayosSubscriptionPaymentDto,
    @Request() req: any,
  ): Promise<PayosPaymentResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException(
        'Không tìm thấy userId trong token. Vui lòng đăng nhập lại.',
      );
    }
    return this.shopSubscriptionService.createPayosSubscriptionPayment(
      dto.sub_shop_id,
      userId,
    );
  }

  @Post('payments/payos/webhook')
  @Public()
  @ApiOperation({
    summary: 'PayOS Webhook (Public - chỉ dành cho PayOS gọi)',
    description:
      'Endpoint nhận thông báo thanh toán từ PayOS server. Tự động xác thực chữ ký và kích hoạt shop sau khi thanh toán thành công. KHÔNG gọi endpoint này từ frontend.',
  })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async payosWebhook(
    @Body() body: Record<string, any>,
  ): Promise<{ message: string }> {
    return this.shopSubscriptionService.handlePayosWebhook(body);
  }

  @Get('payments/payos/callback')
  @Public()
  @ApiOperation({
    summary: 'PayOS redirect callback sau thanh toán (Public)',
    description:
      'PayOS redirect user về endpoint này sau khi thanh toán. Backend xác nhận kết quả và redirect đến trang success/failed của frontend.',
  })
  @ApiResponse({ status: 302, description: 'Redirect đến frontend' })
  async payosCallback(
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    const { orderCode, code, desc } = query;

    // Fallback update: if webhook chưa bắn hoặc bị miss, callback vẫn cập nhật DB.
    await this.shopSubscriptionService.handlePayosCallback(query);

    // code = 00 là thành công
    if (code === '00') {
      res.redirect(
        `${frontendUrl}/payment/success?orderCode=${orderCode ?? ''}`,
      );
    } else {
      res.redirect(
        `${frontendUrl}/payment/failed?orderCode=${orderCode ?? ''}&code=${code ?? ''}&desc=${desc ?? ''}`,
      );
    }
  }

  @Post('renew/payos')
  @ApiOperation({
    summary: 'Gia hạn subscription bằng PayOS - Cần login (SHOPOWNER)',
    description:
      'Tạo yêu cầu thanh toán PayOS để gia hạn subscription. Trả về `checkoutUrl` để redirect user đến trang thanh toán PayOS.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tạo link gia hạn PayOS thành công',
    type: PayosPaymentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async renewPayosSubscription(
    @Request() req: any,
  ): Promise<PayosPaymentResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException(
        'Không tìm thấy userId trong token. Vui lòng đăng nhập lại.',
      );
    }
    return this.shopSubscriptionService.renewPayosSubscription(userId);
  }
} //het
