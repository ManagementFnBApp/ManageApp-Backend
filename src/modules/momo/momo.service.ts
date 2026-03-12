import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as https from 'https';

export interface MomoPaymentResponse {
  partnerCode: string;
  requestId: string;
  orderId: string;
  amount: number;
  responseTime: number;
  message: string;
  resultCode: number;
  payUrl: string;
  shortLink?: string;
  qrCodeUrl?: string;
  deeplink?: string;
}

@Injectable()
export class MomoService {
  private readonly logger = new Logger(MomoService.name);

  private readonly partnerCode: string;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly endpoint: string;
  private readonly ipnUrl: string;
  private readonly redirectUrl: string;

  constructor(private configService: ConfigService) {
    this.partnerCode = this.configService.get<string>(
      'MOMO_PARTNER_CODE',
      'MOMO',
    );
    this.accessKey = this.configService.get<string>(
      'MOMO_ACCESS_KEY',
      'F8BBA842ECF85',
    );
    this.secretKey = this.configService.get<string>(
      'MOMO_SECRET_KEY',
      'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    );
    this.endpoint = this.configService.get<string>(
      'MOMO_ENDPOINT',
      'https://test-payment.momo.vn/v2/gateway/api/create',
    );
    this.ipnUrl = this.configService.get<string>(
      'MOMO_IPN_URL',
      'https://cheryle-carduaceous-unsolemnly.ngrok-free.dev/subscriptions/payments/momo/ipn',
    );
    this.redirectUrl = this.configService.get<string>(
      'MOMO_REDIRECT_URL',
      'http://localhost:5173/payment/success',
    );
  }

  /**
   * Tạo yêu cầu thanh toán MoMo và trả về payUrl + qrCodeUrl
   */
  async createPayment(
    orderId: string,
    amount: number,
    orderInfo: string,
    extraData: string = '',
  ): Promise<MomoPaymentResponse> {
    const requestId = `${orderId}_${Date.now()}`;
    const requestType = 'payWithMethod';

    const rawSignature = [
      `accessKey=${this.accessKey}`,
      `amount=${amount}`,
      `extraData=${extraData}`,
      `ipnUrl=${this.ipnUrl}`,
      `orderId=${orderId}`,
      `orderInfo=${orderInfo}`,
      `partnerCode=${this.partnerCode}`,
      `redirectUrl=${this.redirectUrl}`,
      `requestId=${requestId}`,
      `requestType=${requestType}`,
    ].join('&');

    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    const body = JSON.stringify({
      partnerCode: this.partnerCode,
      accessKey: this.accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl: this.redirectUrl,
      ipnUrl: this.ipnUrl,
      lang: 'vi',
      extraData,
      requestType,
      signature,
    });

    this.logger.log(`Tạo MoMo payment: orderId=${orderId}, amount=${amount}`);

    return this.postRequest(this.endpoint, body);
  }

  /**
   * Xác thực chữ ký IPN từ MoMo (v2)
   */
  verifyIPN(ipnData: Record<string, any>): boolean {
    const {
      accessKey,
      amount,
      extraData,
      message,
      orderId,
      orderInfo,
      orderType,
      partnerCode,
      payType,
      requestId,
      responseTime,
      resultCode,
      transId,
      signature,
    } = ipnData;

    const rawSignature = [
      `accessKey=${accessKey}`,
      `amount=${amount}`,
      `extraData=${extraData}`,
      `message=${message}`,
      `orderId=${orderId}`,
      `orderInfo=${orderInfo}`,
      `orderType=${orderType}`,
      `partnerCode=${partnerCode}`,
      `payType=${payType}`,
      `requestId=${requestId}`,
      `responseTime=${responseTime}`,
      `resultCode=${resultCode}`,
      `transId=${transId}`,
    ].join('&');

    const expectedSignature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    return expectedSignature === signature;
  }

  private postRequest(
    url: string,
    body: string,
  ): Promise<MomoPaymentResponse> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);

      const options: https.RequestOptions = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
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
            resolve(JSON.parse(data) as MomoPaymentResponse);
          } catch {
            reject(new Error('Failed to parse MoMo response'));
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.write(body);
      req.end();
    });
  }
}
