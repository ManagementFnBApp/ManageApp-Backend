import { IsString, IsNotEmpty, IsOptional, IsObject } from "class-validator";

// Response DTO
export class RoleResponseDto {
    roleId: number;
    roleCode: string;
    description?: string | null;
    permissions?: any;
    createdAt?: Date;
    updatedAt?: Date;
}

// DTO cho việc tạo role mới
export class CreateRoleDto {
    @IsString()
    @IsNotEmpty({ message: "Role code không được để trống" })
    roleCode: string;

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
    roleCode?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsObject()
    @IsOptional()
    permissions?: any;
}
