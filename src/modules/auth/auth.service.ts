import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthPermission, AuthResponseDto, LoginDto, LoginResponseDto } from "src/dtos/login.dto";
import { UserService } from "../users/user.service";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "../../dtos/register.dto";
import { UserResponseDto } from "../../dtos/user.dto";
import * as bcrypt from 'bcrypt'
import { getJwtExpiresIn } from "src/config/jwt.config";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async login({ username, password }: LoginDto): Promise<AuthPermission> {
        const user = await this.userService.getUserByUsername(username);
        if (!user) {
            throw new UnauthorizedException("Username or password is incorrect");
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException("Username or password is incorrect");
        }
        // Tạo payload với sub chứa user_id
        const payload = {
            sub: user.user_id,
            username: user.username,
            role: user.role,
            ownerManagerId: user.ownerManagerId
        };
        return new AuthPermission({
            user_id: user.user_id,
            token: await this.jwtService.signAsync(payload),
            expiredTime: getJwtExpiresIn(this.configService),
        });
    }

    //REGISTER
    async register(dto: RegisterDto): Promise<UserResponseDto> {
        // Register cơ bản - không tạo tenant
        // Tenant sẽ được tạo sau khi user thanh toán subscription thành công
        return this.userService.createUser({
            ...dto,
            tenantId: undefined,
            roleCode: undefined,
        });
    }

    //FORGOT-PASSWORD
    async forgotPassword(email: string): Promise<{ message: string, token?: string }> {
        const user = await this.userService.getUserByEmail(email);
        if (!user) {
            return { message: "If user was existed, reset token was sent" }
        }
        const token = await this.jwtService.sign(
            { sub: user.user_id },
            { expiresIn: '30m' }

        )
        return {
            message: "Reset token generate",
            token
        }
    }

    //RESET-PASSWORD
    async resetPassword(
        token: string,
        newPassword: string
    ): Promise<{ message: string }> {
        let payload: { sub: number };

        try {
            payload = this.jwtService.verify<{ sub: number }>(token);
        } catch {
            throw new BadRequestException('Invalid or expired token');
        }

        await this.userService.updatePassword(payload.sub, newPassword);

        return {
            message: 'Password updated successfully. Please login again.',
        };
    }


}