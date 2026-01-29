import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthPermission, LoginDto, LoginResponseDto } from "src/dtos/login.dto";
import { ApiTags } from "@nestjs/swagger";
import { RegisterDto } from "../../dtos/register.dto";
import { ForgotPasswordDto } from "../../dtos/forgot-password.dto";
import { ResetPasswordDto } from "../../dtos/reset-password.dto";
import { HttpMessage, HttpStatus } from "src/global/globalEnum";
import { ResponseData, ResponseType } from "src/global/globalResponse";
import { Public, Roles } from "src/decorators/decorators";
import { UserResponseDto, UserRole } from "src/dtos/user.dto";

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) { }

    @Public()
    @Post('login')
    async login(@Body() { username, password }: LoginDto): Promise<ResponseType<AuthPermission>> {
        return new ResponseData(await this.authService.login({ username, password }), HttpStatus.SUCCESS, HttpMessage.SUCCESS)
    }

    @Post('register')
    async register(@Body() dto: RegisterDto): Promise<ResponseType<UserResponseDto>> {
        return new ResponseData(await this.authService.register(dto), HttpStatus.CREATED_SUCCESS, HttpMessage.SUCCESS)
    }

    @Roles(UserRole.USER)
    @Post('forgot-password')
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.email);
    }

    @Roles(UserRole.USER)
    @Post('reset-password')
    async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
        await this.authService.resetPassword(dto.token, dto.newPassword);
        return { message: 'Password reset successfully' };
    }


}