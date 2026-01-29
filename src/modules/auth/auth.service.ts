import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthPermission, AuthResponseDto, LoginDto, LoginResponseDto } from "src/dtos/login.dto";
import { UserService } from "../users/user.service";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "../../dtos/register.dto";
import { UserResponseDto } from "../../dtos/user.dto";
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
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
        const payload = { ...new AuthResponseDto(user) };
        return new AuthPermission({
            id: user.id,
            token: await this.jwtService.signAsync(payload),
            expiredTime: 900000,
        });
    }

    //REGISTER
    async register(dto: RegisterDto): Promise<UserResponseDto> {
        return this.userService.createUser(
            dto.email,
            dto.username,
            dto.password
        )
    }

    //FORGOT-PASSWORD
    async forgotPassword(email: string): Promise<{ message: string, token?: string }> {
        const user = await this.userService.getUserByEmail(email);
        if (!user) {
            return { message: "If user was existed, reset token was sent" }
        }
        const token = await this.jwtService.sign(
            { sub: user.id },
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