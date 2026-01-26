import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto, LoginResponseDto } from "src/dtos/login.dto";

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) {}
    @Post('login')
    async login(@Body() { username, password }: LoginDto): Promise<LoginResponseDto> {
        return this.authService.login({ username, password });
    }
}