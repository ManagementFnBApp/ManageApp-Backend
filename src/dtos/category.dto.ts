import { IsString } from "class-validator";

export class AdminCreateCategoryDto {
    @IsString()
    category_name: string;
}

export class ResponseCategoryDto {
    id: number;
    category_name: string;
    is_active: boolean;
}