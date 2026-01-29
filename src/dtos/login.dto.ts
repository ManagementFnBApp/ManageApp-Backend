import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export interface JwtPayload {
  sub: number;           // user ID
  username: string;
  role: string;  // or permissions: string[]
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

    constructor({ username, role }) {
        this.username = username;
        this.role = role;
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