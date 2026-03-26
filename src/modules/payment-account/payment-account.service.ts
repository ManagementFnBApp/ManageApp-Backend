import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'db/prisma.service';
import {
  CreatePaymentAccountDto,
  UpdatePaymentAccountDto,
} from 'src/dtos/payment-account.dto';
import { KmsEncryptionService } from '../kms/kms-encryption.service';
import { IsActive } from 'src/decorators/decorators';

@Injectable()
export class PaymentAccountService {
  private readonly logger = new Logger(PaymentAccountService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kmsService: KmsEncryptionService,
  ) {}

  /**
   * Create a payment account for a shop.
   * Encrypts api_key + checksum_key using KMS envelope encryption.
   */
  async create(dto: CreatePaymentAccountDto, shopId: number) {
    // Validate shop exists
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
    });
    if (!shop) {
      throw new NotFoundException(`Shop ID ${shopId} not found`);
    }

    const gatewayProvider = (dto.gateway_provider || 'PAYOS').toUpperCase();

    // Check if the shop already has an active account for this provider
    const existing = await this.prisma.paymentAccount.findFirst({
      where: {
        shop_id: shopId,
        gateway_provider: gatewayProvider as any,
        is_active: true,
      },
    });
    if (existing) {
      throw new BadRequestException(
        `Shop already has an active ${gatewayProvider} payment account. Deactivate it first.`,
      );
    }

    // 1. Generate DEK via KMS
    const { plaintextDek, encryptedDek } =
      await this.kmsService.generateDataKey();

    // 2. Encrypt credentials (api_key + checksum_key as JSON)
    const credentialsJson = JSON.stringify({
      apiKey: dto.api_key,
      checksumKey: dto.checksum_key,
    });

    const { encryptedData, iv, authTag } =
      await this.kmsService.encryptCredentials(credentialsJson, plaintextDek);

    // 3. Store in DB
    const paymentAccount = await this.prisma.paymentAccount.create({
      data: {
        shop_id: shopId,
        gateway_provider: gatewayProvider as any,
        client_id: dto.client_id,
        encrypted_credentials: encryptedData,
        encryption_iv: iv,
        encryption_auth_tag: authTag,
        encrypted_dek: encryptedDek,
        is_active: true,
      },
    });

    this.logger.log(
      `Created payment account ${paymentAccount.id} for shop ${shopId} (${gatewayProvider})`,
    );

    return {
      id: paymentAccount.id,
      shop_id: paymentAccount.shop_id,
      gateway_provider: paymentAccount.gateway_provider,
      client_id: paymentAccount.client_id,
      is_active: paymentAccount.is_active,
      created_at: paymentAccount.created_at,
    };
  }

  /**
   * Find the active payment account for a shop.
   */
  @IsActive()
  async findByShop(shopId: number) {
    const account = await this.prisma.paymentAccount.findFirst({
      where: {
        shop_id: shopId,
        is_active: true,
      },
      select: {
        id: true,
        shop_id: true,
        gateway_provider: true,
        client_id: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!account) {
      throw new NotFoundException(
        `No active payment account found for shop ${shopId}`,
      );
    }

    return account;
  }

  /**
   * Update a payment account — re-encrypts credentials if provided.
   */
  async update(id: string, dto: UpdatePaymentAccountDto, shopId: number) {
    const existing = await this.prisma.paymentAccount.findUnique({
      where: { id },
    });
    if (!existing || existing.shop_id !== shopId) {
      throw new NotFoundException(
        `Payment account ${id} not found for your shop`,
      );
    }

    const updateData: any = {};

    if (dto.client_id) {
      updateData.client_id = dto.client_id;
    }

    // If api_key or checksum_key is being updated, re-encrypt
    if (dto.api_key || dto.checksum_key) {
      // Decrypt current credentials to merge partial updates
      const current = await this.kmsService.decryptCredentials(
        existing.encrypted_credentials,
        existing.encryption_iv,
        existing.encryption_auth_tag,
        existing.encrypted_dek,
      );

      const newCredentials = {
        apiKey: dto.api_key || current.apiKey,
        checksumKey: dto.checksum_key || current.checksumKey,
      };

      const { plaintextDek, encryptedDek } =
        await this.kmsService.generateDataKey();
      const { encryptedData, iv, authTag } =
        await this.kmsService.encryptCredentials(
          JSON.stringify(newCredentials),
          plaintextDek,
        );

      updateData.encrypted_credentials = encryptedData;
      updateData.encryption_iv = iv;
      updateData.encryption_auth_tag = authTag;
      updateData.encrypted_dek = encryptedDek;
    }

    const updated = await this.prisma.paymentAccount.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        shop_id: true,
        gateway_provider: true,
        client_id: true,
        is_active: true,
        updated_at: true,
      },
    });

    return updated;
  }

  /**
   * Soft-deactivate a payment account.
   */
  async remove(id: string, shopId: number) {
    const existing = await this.prisma.paymentAccount.findUnique({
      where: { id },
    });
    if (!existing || existing.shop_id !== shopId) {
      throw new NotFoundException(
        `Payment account ${id} not found for your shop`,
      );
    }

    await this.prisma.paymentAccount.update({
      where: { id },
      data: { is_active: false },
    });

    return { message: `Payment account ${id} deactivated` };
  }
}
