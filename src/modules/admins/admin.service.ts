import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateAdminDto, AdminResponseDto, UpdateAdminDto, AdminLoginDto } from "../../dtos/admin.dto";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from 'bcrypt';
import { ConfigService } from "@nestjs/config";
import { getJwtExpiresIn } from "../../global/constants";

@Injectable()
export class AdminService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService
    ) {}

    // Lấy tất cả admins
    async getAllAdmins(): Promise<AdminResponseDto[]> {
        const admins = await this.prisma.admin.findMany({
            orderBy: { admin_id: 'asc' }
        });
        return admins.map(admin => this.transformToDto(admin));
    }

    // Lấy admin theo ID
    async getAdminById(adminId: number): Promise<AdminResponseDto> {
        const admin = await this.prisma.admin.findUnique({
            where: { admin_id: adminId }
        });

        if (!admin) {
            throw new NotFoundException(`Admin với ID ${adminId} không tồn tại`);
        }

        return this.transformToDto(admin);
    }

    // Lấy admin theo email
    async getAdminByEmail(email: string): Promise<AdminResponseDto | null> {
        const admin = await this.prisma.admin.findUnique({
            where: { email }
        });

        return admin ? this.transformToDto(admin) : null;
    }

    // Tạo admin mới
    async createAdmin(dto: CreateAdminDto, creatorAdminId?: number): Promise<AdminResponseDto> {
        // Kiểm tra email đã tồn tại chưa
        const existed = await this.prisma.admin.findUnique({
            where: { email: dto.email }
        });

        if (existed) {
            throw new BadRequestException(`Email ${dto.email} đã tồn tại`);
        }

        // Hash password
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(dto.password, salt);

        const admin = await this.prisma.admin.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                full_name: dto.fullName,
                phone: dto.phone,
                avatar: dto.avatar,
                manager_id: creatorAdminId || null
            }
        });

        return this.transformToDto(admin);
    }

    // Update admin
    async updateAdmin(adminId: number, dto: UpdateAdminDto): Promise<AdminResponseDto> {
        // Kiểm tra admin có tồn tại không
        const existed = await this.prisma.admin.findUnique({
            where: { admin_id: adminId }
        });

        if (!existed) {
            throw new NotFoundException(`Admin với ID ${adminId} không tồn tại`);
        }

        // Nếu update email, kiểm tra trùng
        if (dto.email && dto.email !== existed.email) {
            const duplicateEmail = await this.prisma.admin.findUnique({
                where: { email: dto.email }
            });

            if (duplicateEmail) {
                throw new BadRequestException(`Email ${dto.email} đã tồn tại`);
            }
        }

        const admin = await this.prisma.admin.update({
            where: { admin_id: adminId },
            data: {
                email: dto.email,
                full_name: dto.fullName,
                phone: dto.phone,
                avatar: dto.avatar,
                is_active: dto.isActive
            }
        });

        return this.transformToDto(admin);
    }

    // Xóa admin
    async deleteAdmin(adminId: number): Promise<{ message: string }> {
        // Kiểm tra admin có tồn tại không
        const existed = await this.prisma.admin.findUnique({
            where: { admin_id: adminId },
            include: {
                tenants: true
            }
        });

        if (!existed) {
            throw new NotFoundException(`Admin với ID ${adminId} không tồn tại`);
        }

        // Kiểm tra có tenant nào đang quản lý không
        if (existed.tenants.length > 0) {
            throw new BadRequestException(
                `Không thể xóa admin này vì đang quản lý ${existed.tenants.length} tenant`
            );
        }

        await this.prisma.admin.delete({
            where: { admin_id: adminId }
        });

        return { message: `Đã xóa admin ${existed.full_name} thành công` };
    }

    // Đổi password
    async changePassword(adminId: number, oldPassword: string, newPassword: string): Promise<{ message: string }> {
        const admin = await this.prisma.admin.findUnique({
            where: { admin_id: adminId }
        });

        if (!admin) {
            throw new NotFoundException('Admin không tồn tại');
        }

        // Kiểm tra password cũ
        const isMatch = await bcrypt.compare(oldPassword, admin.password);
        if (!isMatch) {
            throw new UnauthorizedException('Mật khẩu cũ không đúng');
        }

        // Hash password mới
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await this.prisma.admin.update({
            where: { admin_id: adminId },
            data: { password: hashedPassword }
        });

        return { message: 'Đổi mật khẩu thành công' };
    }

    // Đếm số lượng admin
    async getAdminCount(): Promise<number> {
        return this.prisma.admin.count();
    }

    // Admin login
    async adminLogin(dto: AdminLoginDto): Promise<{ adminId: number; token: string; expiredTime: number }> {
        const admin = await this.prisma.admin.findUnique({
            where: { email: dto.email }
        });

        if (!admin) {
            throw new UnauthorizedException('Email hoặc password không đúng');
        }

        if (!admin.is_active) {
            throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
        }

        const isMatch = await bcrypt.compare(dto.password, admin.password);
        if (!isMatch) {
            throw new UnauthorizedException('Email hoặc password không đúng');
        }

        // Update last_login
        await this.prisma.admin.update({
            where: { admin_id: admin.admin_id },
            data: { last_login: new Date() }
        });

        // Tạo JWT token cho admin
        const payload = {
            sub: admin.admin_id,
            adminId: admin.admin_id,
            email: admin.email,
            fullName: admin.full_name,
            type: 'admin' // Đánh dấu đây là admin token
        };

        return {
            adminId: admin.admin_id,
            token: await this.jwtService.signAsync(payload),
            expiredTime: getJwtExpiresIn(this.configService)
        };
    }

    // Helper method
    private transformToDto(admin: any): AdminResponseDto {
        return {
            adminId: admin.admin_id,
            managerId: admin.manager_id,
            email: admin.email,
            password: admin.password,
            fullName: admin.full_name,
            phone: admin.phone,
            avatar: admin.avatar,
            isActive: admin.is_active,
            lastLogin: admin.last_login,
            createdAt: admin.created_at
        };
    }
}
