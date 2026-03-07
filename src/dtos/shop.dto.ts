import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
} from 'class-validator';
import { Exclude, Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShopResponseDto {
  @ApiProperty()
  @Expose()
  shop_id: number;

  @ApiProperty()
  @Expose()
  shop_name: string;

  @ApiPropertyOptional()
  @Expose()
  address?: string;

  @ApiPropertyOptional()
  @Expose()
  phone?: string;

  @ApiProperty()
  @Expose()
  is_active: boolean;

  @ApiProperty()
  @Expose()
  created_at: Date;

  @ApiProperty()
  @Expose()
  update_at: Date;

  constructor(partial: Partial<ShopResponseDto>) {
    Object.assign(this, partial);
  }
}

export class CreateShopDto {
  @ApiProperty({ example: 'My Shop' })
  @IsString()
  @IsNotEmpty()
  shopName: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '0123456789' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class UpdateShopDto {
  @ApiPropertyOptional({ example: 'My Updated Shop' })
  @IsOptional()
  @IsString()
  shopName?: string;

  @ApiPropertyOptional({ example: '456 New St' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '0987654321' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
