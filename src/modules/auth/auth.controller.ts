import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto, LoginResponseDto } from "src/modules/auth/dtos/login.dto";
import { RegisterDto, RegisterResponseDto } from "./dtos/register.dto";
import { ForgotPasswordDto } from "../users/dtos/forgot-password.dto";
import { ResetPasswordDto } from "../users/dtos/reset-password.dto";

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
    async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto>{
        return await this.authService.register(dto)
    }

    @Post('forgot-password')
    async forgotPassword(@Body() dto: ForgotPasswordDto){
        return this.authService.forgotPassword(dto.email);
    }

    @Post('reset-password')
    async resetPassword(@Body() dto: ResetPasswordDto): Promise<{message: string}>{
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password reset successfully' };
    }


}