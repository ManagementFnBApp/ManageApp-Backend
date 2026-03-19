import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateProfileDto {
    @IsString()
    @IsOptional()
    full_name?: string;

    @IsString()
    @IsOptional()
    avatar?: string;

    @IsString()
    @IsOptional()
    phone?: string;
}

export class UpdateProfileDto {
    @IsString()
    @IsOptional()
    full_name?: string;

    @IsString()
    @IsOptional()
    avatar?: string;

    @IsString()
    @IsOptional()
    phone?: string;
}

export class ProfileResponseDto {
    profile_id: string;
    user_id: number;
    full_name: string;
    avatar?: string | null;
    phone?: string | null;
}