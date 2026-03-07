import { Exclude } from 'class-transformer';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsBoolean,
  IsInt,
} from 'class-validator';

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
  shop_id?: number | null;
  owner_manager_id?: number | null;
  role_id?: number | null;
  email: string;
  username: string;
  @Exclude()
  password: string;
  is_active: boolean;
  last_login?: Date | null;
  role: string | null; // role_code từ relation
  created_at: Date;
  updated_at: Date;
  profile?: ProfileResponseDto | null;
}

// DTO cho việc tạo user mới
export class CreateUserDto {
  @IsInt()
  @IsOptional()
  shop_id?: number;

  @IsInt()
  @IsOptional()
  owner_manager_id?: number;

  @IsInt()
  @IsOptional()
  role_id?: number;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Username không được để trống' })
  @MinLength(3, { message: 'Username phải có ít nhất 3 ký tự' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Password không được để trống' })
  @MinLength(6, { message: 'Password phải có ít nhất 6 ký tự' })
  password: string;
}

// DTO cho việc update user
export class UpdateUserDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(3, { message: 'Username phải có ít nhất 3 ký tự' })
  username?: string;

  @IsString()
  @IsOptional()
  full_name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsInt()
  @IsOptional()
  shop_id?: number;

  @IsInt()
  @IsOptional()
  role_id?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

// DTO cho việc đổi mật khẩu
export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu cũ không được để trống' })
  oldPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  newPassword: string;
}
// DTO cho việc assign role cho user
export class AssignRoleDto {
  @IsInt({ message: 'role_id phải là số nguyên' })
  @IsNotEmpty({ message: 'role_id không được để trống' })
  role_id: number;
}
// DTO cho SHOPOWNER t?o user m?i (SHOPOWNER ho?c STAFF)
export class CreateManagedUserDto {
  @IsEmail({}, { message: 'Email kh�ng h?p l?' })
  @IsNotEmpty({ message: 'Email kh�ng ��?c �? tr?ng' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Username kh�ng ��?c �? tr?ng' })
  @MinLength(3, { message: 'Username ph?i c� �t nh?t 3 k? t?' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Password kh�ng ��?c �? tr?ng' })
  @MinLength(6, { message: 'Password ph?i c� �t nh?t 6 k? t?' })
  password: string;

  @IsString()
  @IsNotEmpty({
    message: 'role_code kh�ng ��?c �? tr?ng (SHOPOWNER ho?c STAFF)',
  })
  role_code: string; // Ch? nh?n 'SHOPOWNER' ho?c 'STAFF'
}
