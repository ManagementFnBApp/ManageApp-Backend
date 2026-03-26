import { Module } from '@nestjs/common';
import { PaymentAccountService } from './payment-account.service';
import { PaymentAccountController } from './payment-account.controller';
import { KmsEncryptionModule } from '../kms/kms-encryption.module';

@Module({
  imports: [KmsEncryptionModule],
  controllers: [PaymentAccountController],
  providers: [PaymentAccountService],
})
export class PaymentAccountModule {}
