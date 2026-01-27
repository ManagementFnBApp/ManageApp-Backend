import { Exclude } from "class-transformer";

export class UserResponseDto {
    id: number;
    email: string | null;
    username: string;
    @Exclude()
    password: string;
    createdAt: Date;
    updatedAt: Date;
}

export enum UserRole {
    ADMIN = "ADMIN",
    USER = "USER",
}