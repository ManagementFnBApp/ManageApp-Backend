import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { UserResponseDto } from "../users/dtos/user.dto";
import * as bcrypt from 'bcrypt'
@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
    ) { }

    async getAllUsers(): Promise<UserResponseDto[]> {
        return this.prisma.user.findMany();
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
            throw new BadRequestException("Email or username was exited");
        }

        const hashPassword = await bcrypt.hash(password,10);

        return this.prisma.user.create({
            data: {
                email,
                username,
                password : hashPassword
            }
        })
    }
}