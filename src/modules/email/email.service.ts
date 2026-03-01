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

  async sendSubscriptionExpiredNotification(
    toEmail: string,
    shopName: string,
    packageCode: string,
    endDate: Date,
  ): Promise<void> {
    const formattedDate = endDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: toEmail,
      subject: `⚠️ Subscription của shop "${shopName}" đã hết hạn`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px;">
          <div style="background-color: #ff6b6b; color: white; padding: 15px; border-radius: 5px; text-align: center;">
            <h2 style="margin: 0;">⚠️ Subscription Đã Hết Hạn</h2>
          </div>
          
          <div style="padding: 20px;">
            <p style="font-size: 16px;">Xin chào,</p>
            
            <p style="font-size: 14px; line-height: 1.6;">
              Subscription của shop <strong style="color: #333;">${shopName}</strong> (gói <strong>${packageCode}</strong>) 
              đã hết hạn vào ngày <strong style="color: #ff6b6b;">${formattedDate}</strong>.
            </p>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>⏰ Lưu ý quan trọng:</strong><br>
                Shop của bạn sẽ bị xóa vĩnh viễn sau <strong>14 ngày</strong> kể từ ngày hết hạn nếu không gia hạn.
                Tất cả dữ liệu bao gồm sản phẩm, đơn hàng, khách hàng sẽ bị xóa và không thể khôi phục.
              </p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Những gì bị ảnh hưởng:</h3>
              <ul style="line-height: 1.8; color: #666;">
                <li>❌ Shop của bạn đã bị tạm ngưng hoạt động</li>
                <li>❌ Bạn và nhân viên không thể truy cập các tính năng quản lý shop</li>
                <li>❌ Khách hàng không thể thực hiện giao dịch</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 16px; font-weight: bold; margin-bottom: 15px;">
                Vui lòng gia hạn ngay để tiếp tục sử dụng dịch vụ!
              </p>
              <a href="${this.configService.get<string>('APP_URL')}/subscriptions/renew" 
                 style="display: inline-block; background-color: #28a745; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Gia Hạn Ngay
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="font-size: 13px; color: #666;">
                Nếu bạn cần hỗ trợ hoặc có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua email 
                <a href="mailto:baanhnguyennn@gmail.com" style="color: #007bff;">baanhnguyennn@gmail.com</a>
              </p>
            </div>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="color: #999; font-size: 11px; text-align: center;">
            Email này được gửi tự động từ hệ thống. Vui lòng không trả lời email này.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email thông báo subscription expired đã được gửi đến ${toEmail}`);
    } catch (error) {
      console.error('❌ Lỗi khi gửi email thông báo subscription expired:', error);
      // Không throw error để không làm gián đoạn cron job
    }
  }
}
