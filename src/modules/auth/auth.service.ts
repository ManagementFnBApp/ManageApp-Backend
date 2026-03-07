import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthPermission, LoginDto } from 'src/dtos/login.dto';
import { UserService } from '../users/user.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from '../../dtos/register.dto';
import { UserResponseDto } from '../../dtos/user.dto';
import * as bcrypt from 'bcrypt';
import { getJwtExpiresIn } from 'src/config/jwt.config';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { VerifyOTPDto } from 'src/dtos/forgot-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  private readonly temporaryUsers: Map<string, string> = new Map();
  private readonly codeExpiration: Map<string, Date> = new Map();

  private generateRandomCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async login({ username, password }: LoginDto): Promise<AuthPermission> {
    const user = await this.userService.getUserByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Username or password is incorrect');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Username or password is incorrect');
    }
    // Tạo payload với sub chứa user_id
    const payload = {
      id: user.user_id,
      username: user.username,
      role: user.role,
      owner_manager_id: user.owner_manager_id,
      shop_id: user.shop_id,
    };
    return new AuthPermission({
      user_id: user.user_id,
      token: await this.jwtService.signAsync(payload),
      expiredTime: getJwtExpiresIn(this.configService),
    });
  }

  //REGISTER
  async register(dto: RegisterDto): Promise<UserResponseDto> {
    // Register cơ bản - không tạo shop
    // Shop sẽ được tạo sau khi user thanh toán subscription thành công
    return this.userService.createUser({
      ...dto,
    });
  }

  //FORGOT-PASSWORD
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userService.getUserByEmail(email);
    if (!user) {
      throw new NotFoundException({ message: 'Email not found' });
    }
    const verificationCode = this.generateRandomCode();
    this.temporaryUsers.set(verificationCode, user.email);
    this.codeExpiration.set(
      verificationCode,
      new Date(Date.now() + 10 * 60 * 1000),
    );

    await this.sendVerificationCode(email, verificationCode);
    return {
      message: 'Verification code has sent to email',
    };
  }

  //RESET-PASSWORD
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    let payload: { id: number; purpose?: string };

    try {
      payload = this.jwtService.verify<{ id: number; purpose?: string }>(token);
    } catch {
      throw new BadRequestException('Invalid or expired token');
    }

    if (payload.purpose !== 'password-reset') {
      throw new BadRequestException('Invalid token type');
    }

    await this.userService.updatePassword(payload.id, newPassword);

    return {
      message: 'Password updated successfully. Please login again.',
    };
  }

  async verifyUser(
    body: VerifyOTPDto,
  ): Promise<{ message: string; token?: string }> {
    const expirationDate = this.codeExpiration.get(body.otp);

    if (!expirationDate) {
      throw new BadRequestException('Verification code is invalid');
    }

    if (Date.now() > expirationDate.getTime()) {
      this.temporaryUsers.delete(body.otp);
      this.codeExpiration.delete(body.otp);
      throw new BadRequestException('Verification code expired');
    }

    const email = this.temporaryUsers.get(body.otp);
    if (!email) {
      throw new BadRequestException('Invalid verification code');
    }

    const user = await this.userService.getUserByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resetToken = await this.jwtService.signAsync(
      { id: user.user_id, purpose: 'password-reset' },
      { expiresIn: '5m' }, // 5 minutes to reset password
    );

    this.temporaryUsers.delete(body.otp);
    this.codeExpiration.delete(body.otp);

    return {
      message: 'Verification successful',
      token: resetToken,
    };
  }

  async sendVerificationCode(
    email: string,
    verificationCode: string,
  ): Promise<void> {
    try {
      await this.emailService.sendVerificationCode(email, verificationCode);
      console.log(`Verification code sent to ${email}`);
    } catch (error) {
      console.error(`Error sending verification code to ${email}:`, error);
      throw new InternalServerErrorException(
        'Failed to send verification code',
      );
    }
  }
}
