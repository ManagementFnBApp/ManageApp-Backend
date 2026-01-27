import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  username: string;

  @MinLength(6)
  password: string;
}

export class RegisterResponseDto {
  id: number;
  email: string;
  username: string;
  createdAt?: Date;
}
