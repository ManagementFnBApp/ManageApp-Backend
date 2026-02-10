import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString, IsInt } from "class-validator";

export class RegisterDto {
  @IsInt()
  @IsOptional()
  tenantId?: number;

  @IsInt()
  @IsOptional()
  shopId?: number;

  @IsInt()
  @IsOptional()
  ownerManagerId?: number;

  @IsString()
  @IsOptional()
  roleCode?: string;

  @IsEmail({}, { message: "Email không hợp lệ" })
  @IsNotEmpty({ message: "Email không được để trống" })
  email: string;

  @IsString()
  @IsNotEmpty({ message: "Username không được để trống" })
  @MinLength(3, { message: "Username phải có ít nhất 3 ký tự" })
  username: string;

  @IsString()
  @IsNotEmpty({ message: "Password không được để trống" })
  @MinLength(6, { message: "Password phải có ít nhất 6 ký tự" })
  password: string;
}

export class RegisterResponseDto {
  id: number;
  email: string;
  username: string;
  createdAt: Date;
}
