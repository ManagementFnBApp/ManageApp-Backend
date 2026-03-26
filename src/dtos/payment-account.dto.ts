import { PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePaymentAccountDto {
  @IsString()
  @IsNotEmpty()
  client_id: string;

  @IsString()
  @IsNotEmpty()
  api_key: string;

  @IsString()
  @IsNotEmpty()
  checksum_key: string;

  @IsString()
  @IsOptional()
  gateway_provider?: string; // defaults to PAYOS
}

export class UpdatePaymentAccountDto extends PartialType(
  CreatePaymentAccountDto,
) {}
