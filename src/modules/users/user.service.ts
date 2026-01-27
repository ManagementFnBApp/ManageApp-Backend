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
   
    //CREATE USER
    async creatUser(email: string, username: string, password: string): Promise<UserResponseDto>{
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
            },
            select:{
                id: true,
                email: true,
                username: true,
                createdAt: true,
                updatedAt: true,
            }
        })
    }
    
    //UPDATE PASSWORD
    async updatePassword(userId: number, newPassword: string): Promise<void>{
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(newPassword, salt);
        await this.prisma.user.update({
            where :{id: userId},
            data: {
                password: hashPassword,
            }
        })
    }

    //FIND BY EMAIL
    async getUserByEmail(email: string): Promise<UserResponseDto | null>{
        return this.prisma.user.findUnique({
            where : {email}
        })
    }
}