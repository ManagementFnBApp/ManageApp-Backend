import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class JwtPayloadDto {
  id: number; // user ID
  username?: string;
  role: string | null; // or permissions: string[]
  owner_manager_id: number | null; // Để check SHOPOWNER gốc
  shop_id: number | undefined; // Để check SHOP STAFF
}

export class LoginDto {
  @ApiProperty()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;
}

export class LoginResponseDto {
  accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }
}

export class AuthResponseDto {
  username: string;
  role: string | null;
  owner_manager_id?: number | null;

  constructor({
    username,
    role,
    owner_manager_id,
  }: {
    username: string;
    role: string;
    owner_manager_id?: number | null;
  }) {
    this.username = username;
    this.role = role;
    this.owner_manager_id = owner_manager_id;
    return this;
  }
}

export class AuthPermission {
  user_id: number;
  token: string;
  expiredTime: number;

  constructor({ user_id, token, expiredTime }) {
    this.user_id = user_id;
    this.token = token;
    this.expiredTime = expiredTime;

    return this;
  }
}
