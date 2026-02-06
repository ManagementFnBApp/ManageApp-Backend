import { Exclude } from "class-transformer";
import { IsEmail, IsString, IsNotEmpty, MinLength, IsOptional, IsBoolean, IsInt, IsPhoneNumber } from "class-validator";

// Profile Response DTO
export class ProfileResponseDto {
    profile_id: string;
    full_name: string;
    avatar?: string | null;
    phone?: string | null;
    created_at: Date;
    updated_at: Date;
}

// Response DTO - dùng để trả về dữ liệu user
export class UserResponseDto {
    user_id: number;
    tenantId: number;
    shopId?: number | null;
    ownerManagerId?: number | null;
    roleId: number;
    email: string;
    username: string;
    @Exclude()
    password: string;
    isActive: boolean;
    lastLogin?: Date | null;
    role: string; // role_code từ relation
    createdAt: Date;
    updatedAt: Date;
    profile?: ProfileResponseDto | null;
}

// DTO cho việc tạo user mới
export class CreateUserDto {
    @IsInt()
    @IsOptional()
    tenantId?: number;

    @IsInt()
    @IsOptional()
    shopId?: number;

    @IsInt()
    @IsOptional()
    ownerManagerId?: number;

    @IsInt()
    @IsOptional()
    roleId?: number;

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

    @IsString()
    @IsNotEmpty({ message: "Họ tên không được để trống" })
    fullName: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    avatar?: string;
}

// DTO cho việc update user
export class UpdateUserDto {
    @IsEmail({}, { message: "Email không hợp lệ" })
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    @MinLength(3, { message: "Username phải có ít nhất 3 ký tự" })
    username?: string;

    @IsString()
    @IsOptional()
    fullName?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    avatar?: string;

    @IsInt()
    @IsOptional()
    shopId?: number;

    @IsInt()
    @IsOptional()
    roleId?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

// DTO cho việc đổi mật khẩu
export class ChangePasswordDto {
    @IsString()
    @IsNotEmpty({ message: "Mật khẩu cũ không được để trống" })
    oldPassword: string;

    @IsString()
    @IsNotEmpty({ message: "Mật khẩu mới không được để trống" })
    @MinLength(6, { message: "Mật khẩu mới phải có ít nhất 6 ký tự" })
    newPassword: string;
}
