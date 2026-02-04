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
        const users = await this.prisma.user.findMany({
            include: {
                role: true
            }
        });
        return users.map(user => this.transformToDto(user));
    }


    async getUserByUsername(username: string): Promise<UserResponseDto | null> {
        const user = await this.prisma.user.findUnique({
            where: { username },
            include: {
                role: true
            }
        });
        return user ? this.transformToDto(user) : null;
    }

    //CREATE USER
    async createUser(email: string, username: string, password: string, tenantId?: number, roleCode?: string): Promise<UserResponseDto> {
        const existed = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ],
            },
        });

        if (existed) {
            throw new BadRequestException("Email or username was existed");
        }

        // Tìm role nếu có roleCode
        let roleId: number | null = null;
        if (roleCode) {
            const role = await this.prisma.role.findUnique({
                where: { role_code: roleCode }
            });
            if (!role) {
                throw new BadRequestException(`Role ${roleCode} không tồn tại`);
            }
            roleId = role.role_id;
        }

        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(password, salt);

        const user = await this.prisma.user.create({
            data: {
                tenant_id: tenantId || null,
                role_id: roleId,
                email,
                username,
                password: hashPassword,
                full_name: username
            },
            include: {
                role: true
            }
        });
        return this.transformToDto(user);
    }

    //UPDATE PASSWORD
    async updatePassword(userId: number, newPassword: string): Promise<void> {
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(newPassword, salt);
        await this.prisma.user.update({
            where: { user_id: userId },
            data: {
                password: hashPassword,
            }
        })
    }

    //FIND BY EMAIL
    async getUserByEmail(email: string): Promise<UserResponseDto | null> {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                role: true
            }
        });
        return user ? this.transformToDto(user) : null;
    }

    // Đếm số lượng user trong hệ thống
    async getUserCount(): Promise<number> {
        return this.prisma.user.count();
    }

    // Helper method to transform Prisma User to UserResponseDto
    private transformToDto(user: any): UserResponseDto {
        return {
            id: user.user_id,
            tenantId: user.tenant_id,
            shopId: user.shop_id,
            ownerManagerId: user.owner_manager_id,
            roleId: user.role_id,
            email: user.email,
            username: user.username,
            password: user.password,
            avatar: user.avatar,
            fullName: user.full_name,
            phone: user.phone,
            isActive: user.is_active,
            lastLogin: user.last_login,
            role: user.role?.role_code || null,
            createdAt: user.created_at,
            updatedAt: user.updated_at
        };
    }
}