import { IsString, IsNotEmpty, IsInt, IsDecimal, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO cho Subscription Payment
export class CreateSubscriptionPaymentDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  subTenantId: number;
  
  // userId sẽ được lấy từ token user đang login, không cần nhập

  @ApiProperty({ example: 'BANK_TRANSFER' })
  @IsString()
  @IsNotEmpty()
  method: string;

  @ApiProperty({ example: 299000 })
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: 'pending' })
  @IsString()
  @IsNotEmpty()
  paymentStatus: string; // pending, success, failed
}

export class UpdateSubscriptionPaymentStatusDto {
  @ApiProperty({ example: 'success' })
  @IsString()
  @IsNotEmpty()
  paymentStatus: string; // success, failed, pending
}

export class SubscriptionPaymentResponseDto {
  sub_payment_id: number;
  sub_tenant_id: number;
  method: string;
  amount: number;
  created_at: Date;
  payment_status: string;
  
  // Thông tin tenant nếu đã tạo (khi payment success)
  tenant?: {
    tenant_id: number;
    tenant_name: string;
  };
  
  // Thông tin user
  user?: {
    user_id: number;
    username: string;
    role: string;
  };
}

// DTO cho Subscription Tenant
export class CreateSubscriptionTenantDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  subscriptionId: number;
  
  // userId sẽ được lấy từ token user đang login, không cần nhập
}

export class SubscriptionTenantResponseDto {
  sub_tenant_id: number;
  subscription_id: number;
  tenant_id: number;
  number_of_renewals: number;
  created_at: Date;
  updated_at: Date;
  is_expired: boolean;
}

export class ChangeSubscriptionDto {
  @ApiProperty({ example: 2, description: 'ID của gói subscription mới muốn chuyển đến' })
  @IsInt()
  @IsNotEmpty()
  newSubscriptionId: number;
}

// DTO cho Subscription
export class CreateSubscriptionDto {
  @ApiProperty({ example: 'BASIC' })
  @IsString()
  @IsNotEmpty()
  packageCode: string;

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
  billingCycle: string; // MONTHLY, YEARLY

  @ApiPropertyOptional()
  @IsOptional()
  features?: any;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ example: 'PREMIUM' })
  @IsString()
  @IsOptional()
  packageCode?: string;

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
  billingCycle?: string; // MONTHLY, YEARLY

  @ApiPropertyOptional()
  @IsOptional()
  features?: any;
}

export class SubscriptionResponseDto {
  subscription_id: number;
  package_code: string;
  description?: string;
  price: number;
  billing_cycle: string;
  features?: any;
}
