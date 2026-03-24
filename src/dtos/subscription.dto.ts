import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO cho Subscription Payment
export class CreateSubscriptionPaymentDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  sub_shop_id: number;

  // userId sẽ được lấy từ token user đang login, không cần nhập

  @ApiProperty({ example: 'BANK_TRANSFER' })
  @IsString()
  @IsNotEmpty()
  method: string;

  @ApiProperty({
    example: 299000,
    description:
      'Số tiền thanh toán - PHẢI BẰNG với price của subscription package',
  })
  @IsNotEmpty()
  amount: number;

  // paymentStatus sẽ tự động là 'pending' khi tạo mới
}

// Không cần DTO cho update payment status nữa
// API sẽ tự động update từ 'pending' thành 'success'

export class RenewSubscriptionPaymentDto {
  @ApiProperty({ example: 'BANK_TRANSFER' })
  @IsString()
  @IsNotEmpty()
  method: string;

  // subscription_id sẽ được lấy từ shop subscription hiện tại của user
  // amount sẽ được lấy từ subscription package
  // user_id sẽ được lấy từ token
}

export class SubscriptionPaymentResponseDto {
  sub_payment_id: number;
  sub_shop_id: number;
  method: string;
  amount: number;
  created_at: Date;
  payment_status: string;

  // Thông tin shop nếu đã tạo (khi payment success)
  shop?: {
    shop_id: number;
    shop_name: string;
  };

  // Thông tin user
  user?: {
    user_id: number;
    username: string;
    role: string;
  };
}

// DTO cho Subscription Shop
export class CreateSubscriptionShopDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  subscription_id: number;

  @ApiProperty({
    example: 'My Shop Name',
    description: 'Tên shop mà user muốn đặt',
  })
  @IsString()
  @IsNotEmpty()
  shop_name: string;

  // userId sẽ được lấy từ token user đang login, không cần nhập
}

export class SubscriptionShopResponseDto {
  sub_shop_id: number;
  subscription_id: number;
  shop_id: number;
  number_of_renewals: number;
  start_date: Date;
  end_date?: Date | null;
  created_at: Date;
  updated_at: Date;
  is_expired: boolean;

  // Thông tin subscription package để user biết giá cần thanh toán
  subscription?: {
    package_code: string;
    price: number;
    billing_cycle: string;
  };
}

export class ChangeSubscriptionDto {
  @ApiProperty({
    example: 2,
    description: 'ID của gói subscription mới muốn chuyển đến',
  })
  @IsInt()
  @IsNotEmpty()
  new_subscription_id: number;
}

// DTO cho Subscription
export class CreateSubscriptionDto {
  @ApiProperty({ example: 'BASIC' })
  @IsString()
  @IsNotEmpty()
  package_code: string;

  @ApiPropertyOptional({ example: 'Basic package for small businesses' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 299000 })
  @IsNotEmpty()
  price: number;

  @ApiProperty({ example: 'MONTHLY' })
  @IsString()
  @IsNotEmpty()
  billing_cycle: string; // MONTHLY, YEARLY

  @ApiPropertyOptional()
  @IsOptional()
  features?: any;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ example: 'PREMIUM' })
  @IsString()
  @IsOptional()
  package_code?: string;

  @ApiPropertyOptional({ example: 'Premium package for large businesses' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 599000 })
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 'YEARLY' })
  @IsString()
  @IsOptional()
  billing_cycle?: string; // MONTHLY, YEARLY

  @ApiPropertyOptional()
  @IsOptional()
  features?: any;

  @ApiPropertyOptional({
    example: true,
    description: 'Trạng thái hoạt động của gói',
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class SubscriptionResponseDto {
  subscription_id: number;
  package_code: string;
  description?: string;
  price: number;
  billing_cycle: string;
  features?: any;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

// ==================== PAYOS PAYMENT DTOs ====================

export class CreatePayosSubscriptionPaymentDto {
  @ApiProperty({
    example: 1,
    description: 'ID của shop subscription (lấy từ bước tạo shop)',
  })
  @IsInt()
  @IsNotEmpty()
  sub_shop_id: number;
}

export class PayosPaymentResponseDto {
  @ApiProperty({ example: 1 })
  paymentId: number;

  @ApiProperty({ example: 299000 })
  amount: number;

  @ApiProperty({
    example: 'https://web.payos.vn/web/...',
    description: 'URL trang thanh toán PayOS với QR code - redirect user đến đây',
  })
  checkoutUrl: string;

  @ApiProperty({
    example: 'https://qr.payos.vn/...',
    description: 'URL mã QR code dạng ảnh',
    required: false,
  })
  qrCode?: string;

  @ApiProperty({
    example: 123456789,
    description: 'Order code để theo dõi thanh toán',
  })
  orderCode: number;
}
