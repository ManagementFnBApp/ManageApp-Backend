import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean, Min } from 'class-validator';
import { Exclude, Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TenantResponseDto {
  @ApiProperty()
  @Expose()
  tenant_id: number;

  @ApiProperty()
  @Expose()
  admin_id: number;

  @ApiProperty()
  @Expose()
  tenant_name: string;

  @ApiPropertyOptional()
  @Expose()
  loyal_point_per_unit?: number;

  @ApiProperty()
  @Expose()
  is_active: boolean;

  @ApiProperty()
  @Expose()
  created_at: Date;

  @ApiProperty()
  @Expose()
  update_at: Date;

  constructor(partial: Partial<TenantResponseDto>) {
    Object.assign(this, partial);
  }
}

export class CreateTenantDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  adminId: number;

  @ApiProperty({ example: 'My Shop' })
  @IsString()
  @IsNotEmpty()
  tenantName: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  loyalPointPerUnit?: number;
}

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'My Updated Shop' })
  @IsOptional()
  @IsString()
  tenantName?: string;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsInt()
  @Min(0)
  loyalPointPerUnit?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
