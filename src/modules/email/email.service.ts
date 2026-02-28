import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Setup nodemailer transporter
    // Sử dụng Gmail hoặc SMTP service khác
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Hoặc có thể dùng SMTP custom
      auth: {
        user: this.configService.get<string>('EMAIL_USER'), // Email gửi
        pass: this.configService.get<string>('EMAIL_PASSWORD'), // App password (không phải password thường)
      },
    });
  }

  async sendUserCredentials(
    toEmail: string,
    username: string,
    password: string,
  ): Promise<void> {
    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: toEmail,
      subject: 'Tài khoản của bạn đã được tạo',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Chào mừng bạn đến với hệ thống!</h2>
          <p>Tài khoản của bạn đã được tạo thành công. Dưới đây là thông tin đăng nhập:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Username:</strong> ${username}</p>
            <p style="margin: 10px 0;"><strong>Password:</strong> ${password}</p>
          </div>
          
          <p style="color: #666;">Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu tiên để đảm bảo an toàn.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px;">
            Email này được gửi tự động, vui lòng không trả lời email này.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✉️  Email đã được gửi đến ${toEmail}`);
    } catch (error) {
      console.error('Lỗi khi gửi email:', error);
      throw new InternalServerErrorException(
        'Không thể gửi email. Vui lòng kiểm tra cấu hình email.',
      );
    }
  }
}
