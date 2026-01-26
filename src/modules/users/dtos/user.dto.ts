export class UserResponseDto {
    id: number;
    email: string | null;
    username: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
}