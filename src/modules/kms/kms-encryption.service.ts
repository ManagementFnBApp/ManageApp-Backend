import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class KmsEncryptionService {
  // Hàm này gọi lên AWS KMS để lấy Data Key (DEK)
  async generateDataKey() {
    // Mock: Trả về Plaintext DEK (để mã hóa ngay) và Encrypted DEK (để lưu DB)
    return {
      plaintextDek: crypto.randomBytes(32),
      encryptedDek: 'encrypted_dek_from_kms_base64',
    };
  }

  // Hàm mã hóa API Key & Checksum Key thành 1 chuỗi JSON
  async encryptCredentials(credentialsJson: string, plaintextDek: Buffer) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', plaintextDek, iv);

    let encrypted = cipher.update(credentialsJson, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      authTag,
    };
  }

  // Hàm giải mã lấy lại Key bản rõ
  async decryptCredentials(
    encryptedData: string,
    ivHex: string,
    authTagHex: string,
    encryptedDek: string,
  ): Promise<{ apiKey: string; checksumKey: string }> {
    const plaintextDek = await this.askKmsToDecrypt(encryptedDek);

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      plaintextDek,
      Buffer.from(ivHex, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  private async askKmsToDecrypt(encryptedDek: string): Promise<Buffer> {
    // Logic gọi API của AWS/Google KMS ở đây
    return Buffer.alloc(32, 'abvd'); // Mock
  }
}
