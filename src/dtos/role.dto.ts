import { IsString, IsNotEmpty, IsOptional, IsObject } from "class-validator";

// Response DTO
export class RoleResponseDto {
    role_id: number;
    role_code: string;
    description?: string | null;
    permissions?: any;
    created_at?: Date;
    updated_at?: Date;
}

// DTO cho việc tạo role mới
export class CreateRoleDto {
    @IsString()
    @IsNotEmpty({ message: "Role code không được để trống" })
    role_code: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsObject()
    @IsOptional()
    permissions?: any;
}

// DTO cho việc update role
export class UpdateRoleDto {
    @IsString()
    @IsOptional()
    role_code?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsObject()
    @IsOptional()
    permissions?: any;
}