import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCustomerDto {
  @IsInt()
  shop_id: number;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  loyalty_point?: number;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  loyalty_point?: number;
}

export class CustomerResponseDto {
  id: number;
  shop_id: number;
  phone: string;
  full_name: string | null;
  loyalty_point: number;
  created_at: string;
}
