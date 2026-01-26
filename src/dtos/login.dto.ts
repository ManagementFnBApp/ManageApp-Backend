export class LoginDto {
    username: string;
    password: string;
}

export class LoginResponseDto {
    accessToken: string;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }
}