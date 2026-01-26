import { Injectable } from "@nestjs/common";
import { LoginDto, LoginResponseDto } from "src/modules/auth/dtos/login.dto";
import { UserService } from "../users/user.service";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dtos/register.dto";
@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
    ) {}
    async login( { username, password } : LoginDto): Promise<LoginResponseDto> {
        const user = await this.userService.getUserByUsername(username);
        return new LoginResponseDto("dummy-access-token");
    }

    async register(dto:RegisterDto) {
        return await this.userService.creatUser(
            dto.email,
            dto.username,
            dto.password
        )
    }
}