import { Exclude } from "class-transformer";

export class UserResponseDto {
  id: number;
  email: string; 
  @Exclude()
  password?: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}
