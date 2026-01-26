import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto, LoginResponseDto } from "src/modules/auth/dtos/login.dto";
import { RegisterDto } from "./dtos/register.dto";

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) {}
    @Post('login')
    async login(@Body() { username, password }: LoginDto): Promise<LoginResponseDto> {
        return this.authService.login({ username, password });
    }

    @Post('register')
    async register(@Body() dto: RegisterDto){
        return await this.authService.register(dto)
    }
}