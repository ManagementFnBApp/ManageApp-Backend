import { IsEmail, IsString, IsNotEmpty, MinLength, IsOptional, IsBoolean, minLength } from "class-validator";
import { Exclude } from "class-transformer";

// Response DTO
export class AdminResponseDto {
    adminId: number;
    managerId?: number | null;
    email: string;
    @Exclude()
    password: string;
    fullName: string;
    phone?: string | null;
    avatar?: string | null;
    isActive: boolean;
    lastLogin?: Date | null;
    createdAt: Date;
}

// DTO cho việc tạo admin mới
export class CreateAdminDto {
    @IsEmail({}, { message: "Email không hợp lệ" })
    @IsNotEmpty({ message: "Email không được để trống" })
    email: string;

    @IsString()
    @IsNotEmpty({ message: "Password không được để trống" })
    @MinLength(6, { message: "Password phải có ít nhất 6 ký tự" })
    password: string;

    @IsString()
    @IsNotEmpty({ message: "Họ tên không được để trống" })
    fullName: string;

    @IsString()
    @IsOptional()
    @MinLength(8, { message: "Số điện thoại ít nhất là 8 chữ số" })
    phone?: string;

    @IsString()
    @IsOptional()
    avatar?: string;
}

// DTO cho việc update admin
export class UpdateAdminDto {
    @IsEmail({}, { message: "Email không hợp lệ" })
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    fullName?: string;

    @IsString()
    @IsOptional()
    @MinLength(8, { message: "Số điện thoại ít nhất là 8 chữ số" })
    phone?: string;

    @IsString()
    @IsOptional()
    avatar?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

// DTO cho admin login
export class AdminLoginDto {
    @IsEmail({}, { message: "Email không hợp lệ" })
    @IsNotEmpty({ message: "Email không được để trống" })
    email: string;

    @IsString()
    @IsNotEmpty({ message: "Password không được để trống" })
    password: string;
}
