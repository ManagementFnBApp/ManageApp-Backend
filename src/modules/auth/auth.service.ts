import { BadRequestException, Injectable } from "@nestjs/common";
import { LoginDto, LoginResponseDto } from "src/modules/auth/dtos/login.dto";
import { UserService } from "../users/user.service";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dtos/register.dto";
import { UserResponseDto } from "../users/dtos/user.dto";
@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
    ) {}
    async login( { username, password } : LoginDto): Promise<LoginResponseDto> {
        const user = await this.userService.getUserByUsername(username);
        if(!user) {
            throw new Error("Username or password is incorrect");
        }

        return new LoginResponseDto("dummy-access-token");
    }

    //REGISTER
    async register(dto:RegisterDto): Promise<UserResponseDto> {
        return this.userService.creatUser(
            dto.email,
            dto.username,
            dto.password
        )
    }

    //FORGOT-PASSWORD
    async forgotPassword(email: string): Promise<{message: string, token?: string}>{
        const user = await this.userService.getUserByEmail(email);
        if(!user) {
            return {message:"If user was existed, reset token was sent"}
        }
        const token = await this.jwtService.sign(
            {sub: user.id},
            {expiresIn: '30m'}
            
        )
        return {
            message:"Reset token generate",
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