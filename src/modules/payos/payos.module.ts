import { Module } from '@nestjs/common';
import { PayosService } from './payos.service';
import { KmsEncryptionModule } from '../kms/kms-encryption.module';

@Module({
  imports: [KmsEncryptionModule],
  providers: [PayosService],
  exports: [PayosService],
})
export class PayosModule {}
