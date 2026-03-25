import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as https from 'https';

export interface PayosPaymentResponse {
  code?: string;
  desc?: string;
  statusCode?: number;
  message?: string;
  error?: string;
  data?: {
    checkoutUrl: string;
    qrCode: string;
  };
}

export interface PayosIPN {
  code: string;
  desc: string;
  data?: {
    id: string;
    orderCode: number;
    amount: number;
    amountPaid: number;
    amountRemaining: number;
    status: string;
    createdAt: string;
    transactionDateTime: string;
    accountNumber: string;
    reference: string;
    description: string;
    cancellationReason: string;
    cancelledAt: string;
    userInformation: {
      name: string;
      phone: string;
      email: string;
    };
    signature: string;
  };
}

@Injectable()
export class PayosService {
  private readonly logger = new Logger(PayosService.name);

  private readonly clientId: string;
  private readonly apiKey: string;
  private readonly checksumKey: string;
  private readonly endpoint: string;
  private readonly redirectUrl: string;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>(
      'PAYOS_CLIENT_ID',
      'cliyekwj400hh01iagx6o0dyz',
    );
    this.apiKey = this.configService.get<string>(
      'PAYOS_API_KEY',
      '9baf0cc0-ccbc-4a8f-b8ac-d3d70c686c68',
    );
    this.checksumKey = this.configService.get<string>(
      'PAYOS_CHECKSUM_KEY',
      '0f8f9c8f9c8f9c8f9c8f9c8f9c8f9c8f',
    );
    this.endpoint = this.configService.get<string>(
      'PAYOS_ENDPOINT',
      'https://api-merchant.payos.vn/v2',
    );
    this.redirectUrl = this.configService.get<string>(
      'PAYOS_REDIRECT_URL',
      'http://localhost:5173/payment/success',
    );
  }

  /**
   * Tạo yêu cầu thanh toán PayOS
   */
  async createPayment(
    orderCode: number,
    amount: number,
    description: string,
    buyerName?: string,
    buyerPhone?: string,
    buyerEmail?: string,
  ): Promise<PayosPaymentResponse> {
    const returnUrl = `${this.redirectUrl}?orderCode=${orderCode}`;
    const cancelUrl = `${this.redirectUrl}?orderCode=${orderCode}&cancelled=true`;

    const paymentData = {
      orderCode,
      amount,
      description,
      buyerName: buyerName || 'Khach hang',
      buyerPhone: buyerPhone || '',
      buyerEmail: buyerEmail || '',
      returnUrl,
      cancelUrl,
    };

    const signature = this.generateCreatePaymentSignature(paymentData);

    const body = JSON.stringify({
      ...paymentData,
      signature,
    });

    this.logger.log(
      `Tạo PayOS payment: orderCode=${orderCode}, amount=${amount}`,
    );

    return this.postRequest('/payment-requests', body);
  }

  /**
   * Xác thực chữ ký từ IPN
   */
  verifySignature(data: Record<string, any>, signature: string): boolean {
    const dataSignature = this.generateSignature(data);
    return dataSignature === signature;
  }

  /**
   * Lấy thông tin thanh toán từ OrderCode
   */
  async getPaymentInfo(orderCode: number): Promise<PayosPaymentResponse> {
    const path = `/payment-requests/${orderCode}`;

    return new Promise((resolve, reject) => {
      const urlObj = new URL(`${this.endpoint}${path}`);

      const options: https.RequestOptions = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname,
        method: 'GET',
        headers: {
          'x-client-id': this.clientId,
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data) as PayosPaymentResponse);
          } catch {
            reject(new Error('Failed to parse PayOS response'));
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.end();
    });
  }

  /**
   * Hủy yêu cầu thanh toán
   */
  async cancelPayment(orderCode: number): Promise<PayosPaymentResponse> {
    const body = JSON.stringify({
      orderCode,
    });

    return this.postRequest(`/payment-requests/${orderCode}/cancel`, body);
  }

  /**
   * Tạo chữ ký cho dữ liệu
   */
  private generateCreatePaymentSignature(data: {
    orderCode: number;
    amount: number;
    description: string;
    returnUrl: string;
    cancelUrl: string;
  }): string {
    // PayOS expects this exact canonical string for create payment request.
    const signData = [
      `amount=${data.amount}`,
      `cancelUrl=${data.cancelUrl}`,
      `description=${data.description}`,
      `orderCode=${data.orderCode}`,
      `returnUrl=${data.returnUrl}`,
    ].join('&');

    return crypto
      .createHmac('sha256', this.checksumKey)
      .update(signData)
      .digest('hex');
  }

  private generateSignature(data: Record<string, any>): string {
    const dataString = Object.keys(data)
      .sort()
      .map((key) => `${key}=${data[key]}`)
      .join('&');

    return crypto
      .createHmac('sha256', this.checksumKey)
      .update(dataString)
      .digest('hex');
  }

  private postRequest(
    path: string,
    body: string,
  ): Promise<PayosPaymentResponse> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(`${this.endpoint}${path}`);

      const options: https.RequestOptions = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'x-client-id': this.clientId,
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data) as PayosPaymentResponse;
            const statusCode = res.statusCode ?? 500;

            if (statusCode >= 400) {
              const detail =
                parsed.desc ??
                parsed.message ??
                parsed.error ??
                `HTTP ${statusCode}`;
              reject(new Error(`PayOS API lỗi (${statusCode}): ${detail}`));
              return;
            }

            resolve(parsed);
          } catch {
            reject(new Error(`PayOS trả về không hợp lệ: ${data}`));
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.write(body);
      req.end();
    });
  }
}
