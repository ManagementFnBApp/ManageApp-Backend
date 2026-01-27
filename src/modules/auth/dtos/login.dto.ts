import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

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