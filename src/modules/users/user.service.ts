import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { UserResponseDto } from "../users/dtos/user.dto";
import { plainToInstance } from "class-transformer";
import * as bcrypt from 'bcrypt'
@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
    ) { }

    async getAllUsers(): Promise<UserResponseDto[]> {
        const users = await this.prisma.user.findMany();
        return plainToInstance(UserResponseDto, users, { excludeExtraneousValues: false });
    }

    async getUserByUsername(username: string): Promise<UserResponseDto | null> {
        return this.prisma.user.findUnique({
            where: { username },
        });
    }

    async creatUser(email: string, username: string, password: string){
        const existed = await this.prisma.user.findFirst({
            where : {
                OR: [{email},{username}],
            },
        });

        if(existed) {
            throw new BadRequestException("Email or username was existed");
        }

        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(password, salt);

        return this.prisma.user.create({
            data: {
                email,
                username,
                password : hashPassword
            }
        })
    }
}