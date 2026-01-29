import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { UserResponseDto } from "../../dtos/user.dto";
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

    //CREATE USER
    async createUser(email: string, username: string, password: string): Promise<UserResponseDto> {
        const existed = await this.prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });

        if (existed) {
            throw new BadRequestException("Email or username was existed");
        }

        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(password, salt);

         const user = await this.prisma.user.create({
            data: {
                email,
                username,
                password: hashPassword
            },
        });
        return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: false });
    }

    //UPDATE PASSWORD
    async updatePassword(userId: number, newPassword: string): Promise<void> {
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(newPassword, salt);
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                password: hashPassword,
            }
        })
    }

    //FIND BY EMAIL
    async getUserByEmail(email: string): Promise<UserResponseDto | null> {
        return this.prisma.user.findUnique({
            where: { email }
        })
    }
}