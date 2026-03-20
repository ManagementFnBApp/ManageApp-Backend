import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthPermission, LoginDto, LoginResponseDto } from 'src/dtos/login.dto';
import { ApiTags } from '@nestjs/swagger';
import { RegisterDto } from '../../dtos/register.dto';
import {
  ForgotPasswordDto,
  VerifyOTPDto,
} from '../../dtos/forgot-password.dto';
import { ResetPasswordDto } from '../../dtos/reset-password.dto';
import { HttpMessage, HttpStatus } from 'src/global/globalEnum';
import { ResponseData, ResponseType } from 'src/global/globalResponse';
import { Public, Roles } from 'src/decorators/decorators';
import { UserResponseDto } from 'src/dtos/user.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(
    @Body() { username, password }: LoginDto,
  ): Promise<ResponseType<AuthPermission>> {
    return new ResponseData(
      await this.authService.login({ username, password }),
      HttpStatus.SUCCESS,
      HttpMessage.SUCCESS,
    );
  }

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
  ): Promise<ResponseType<UserResponseDto>> {
    return new ResponseData(
      await this.authService.register(dto),
      HttpStatus.CREATED_SUCCESS,
      HttpMessage.SUCCESS,
    );
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<ResponseType<{ message: string }>> {
    return new ResponseData(
      await this.authService.forgotPassword(dto.email),
      HttpStatus.SUCCESS,
      HttpMessage.SUCCESS,
    );
  }

  @Public()
  @Post('reset-password')
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<ResponseType<{ message: string }>> {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return new ResponseData(
      { message: 'Password reset successfully' },
      HttpStatus.SUCCESS,
      HttpMessage.SUCCESS,
    );
  }

  @Public()
  @Post('verify-otp')
  async verifyOTP(
    @Body() body: VerifyOTPDto,
  ): Promise<ResponseType<{ message: string; token?: string }>> {
    const result = await this.authService.verifyUser(body);
    return new ResponseData(result, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
  }
}
