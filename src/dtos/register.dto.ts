import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString } from "class-validator";

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  username: string;

  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  roleCode?: string;  // Optional, mặc định là SHOPOWNER nếu là user đầu tiên
}

export class RegisterResponseDto {
  id: number;
  email: string;
  username: string;
  createdAt: Date;
}
