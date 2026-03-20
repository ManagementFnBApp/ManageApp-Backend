import { IsEmail, IsNumberString, Length } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class VerifyOTPDto {
  @IsNumberString()
  @Length(6, 6)
  otp: string;
}
