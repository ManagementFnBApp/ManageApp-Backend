import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateUserDto, UserResponseDto } from "../../dtos/user.dto";
import * as bcrypt from 'bcrypt'

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
    ) { }

    async getAllUsers(): Promise<UserResponseDto[]> {
        const users = await this.prisma.user.findMany({
            include: {
                role: true,
                profile: true
            }
        });
        return users.map(user => this.transformToDto(user));
    }


    async getUserByUsername(username: string): Promise<UserResponseDto | null> {
        const user = await this.prisma.user.findUnique({
            where: { username },
            include: {
                role: true,
                profile: true
            }
        });
        return user ? this.transformToDto(user) : null;
    }

    //CREATE USER
    async createUser(body: CreateUserDto): Promise<UserResponseDto> {
        const existed = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: body.email },
                    { username: body.username }
                ],
            },
        });

        if (existed) {
            throw new BadRequestException("Email or username was existed");
        }

        // Tìm role nếu có roleCode
        let roleId: number | null = null;
        if (body.roleCode) {
            const role = await this.prisma.role.findUnique({
                where: { role_code: body.roleCode }
            });
            if (!role) {
                throw new BadRequestException(`Role ${body.roleCode} không tồn tại`);
            }
            roleId = role.role_id;
        }

        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(body.password, salt);

        const user = await this.prisma.user.create({
            data: {
                tenant_id: body.tenantId || null,
                role_id: roleId,
                shop_id: body.shopId || null,
                owner_manager_id: body.ownerManagerId || null,
                email: body.email,
                username: body.username,
                password: hashPassword
            },
            include: {
                role: true,
                profile: true
            }
        });
        return this.transformToDto(user);
    }

    async findOrCreate(data: { email: string, fullName: string }): Promise<UserResponseDto> {
        let user = await this.prisma.user.findUnique({ 
            where: { email: data.email },
            include: {
                role: true,
                profile: true
            }
        });

        // 2. Nếu chưa có thì tạo mới
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email: data.email,
                    username: data.email,
                    password: '',
                    profile: {
                        create: {
                            full_name: data.fullName
                        }
                    }
                },
                include: {
                    role: true,
                    profile: true
                }
            });
        }

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
                role: true,
                profile: true
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
            user_id: user.user_id,
            tenantId: user.tenant_id,
            shopId: user.shop_id,
            ownerManagerId: user.owner_manager_id,
            roleId: user.role_id,
            email: user.email,
            username: user.username,
            password: user.password,
            isActive: user.is_active,
            lastLogin: user.last_login,
            role: user.role?.role_code || null,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
            profile: user.profile ? {
                profile_id: user.profile.profile_id,
                full_name: user.profile.full_name,
                avatar: user.profile.avatar,
                phone: user.profile.phone,
                created_at: user.profile.created_at,
                updated_at: user.profile.updated_at
            } : null
        };
    }
}