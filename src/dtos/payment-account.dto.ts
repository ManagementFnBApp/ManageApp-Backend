import { PartialType } from '@nestjs/swagger';

export class CreatePaymentAccountDto {
  clitent_id: string;
  api_key: string;
  checksum_key: string;
}

export class UpdatePaymentAccountDto extends PartialType(
  CreatePaymentAccountDto,
) {}
