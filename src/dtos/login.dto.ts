import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export interface JwtPayload {
  sub: number;           // user ID
  username: string;
  role: string;  // or permissions: string[]
  ownerManagerId?: number | null;  // Để check SHOPOWNER gốc
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
    role: string;
    ownerManagerId?: number | null;

    constructor({ username, role, ownerManagerId }: { username: string; role: string; ownerManagerId?: number | null }) {
        this.username = username;
        this.role = role;
        this.ownerManagerId = ownerManagerId;
        return this;
    }
}

export class AuthPermission {
    id: number;
    token: string;
    expiredTime: number;

    constructor({ id, token, expiredTime }) {
        this.id = id;
        this.token = token;
        this.expiredTime = expiredTime;

        return this;
    }
}