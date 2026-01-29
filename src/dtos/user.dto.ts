import { Exclude } from "class-transformer";

export class UserResponseDto {
    id: number;
    email: string;
    username: string;
    @Exclude()
    password: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
}

export enum UserRole {
    ADMIN = "ADMIN",
    USER = "USER",
}
