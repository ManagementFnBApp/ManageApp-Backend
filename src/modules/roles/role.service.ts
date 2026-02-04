import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateRoleDto, RoleResponseDto, UpdateRoleDto } from "../../dtos/role.dto";

@Injectable()
export class RoleService {
    constructor(private prisma: PrismaService) {}

    // Lấy tất cả roles
    async getAllRoles(): Promise<RoleResponseDto[]> {
        const roles = await this.prisma.role.findMany({
            orderBy: { role_id: 'asc' }
        });
        return roles.map(role => this.transformToDto(role));
    }

    // Lấy role theo ID
    async getRoleById(roleId: number): Promise<RoleResponseDto> {
        const role = await this.prisma.role.findUnique({
            where: { role_id: roleId }
        });

        if (!role) {
            throw new NotFoundException(`Role với ID ${roleId} was not existed`);
        }

        return this.transformToDto(role);
    }

    // Lấy role theo code
    async getRoleByCode(roleCode: string): Promise<RoleResponseDto> {
        const role = await this.prisma.role.findUnique({
            where: { role_code: roleCode }
        });

        if (!role) {
            throw new NotFoundException(`Role ${roleCode} was not existed`);
        }

        return this.transformToDto(role);
    }

    // Tạo role mới
    async createRole(dto: CreateRoleDto): Promise<RoleResponseDto> {
        // Kiểm tra role_code đã tồn tại chưa
        const existed = await this.prisma.role.findUnique({
            where: { role_code: dto.roleCode }
        });

        if (existed) {
            throw new BadRequestException(`Role code ${dto.roleCode} was existed`);
        }

        const role = await this.prisma.role.create({
            data: {
                role_code: dto.roleCode,
                description: dto.description,
                permissions: dto.permissions
            }
        });

        return this.transformToDto(role);
    }

    // Update role
    async updateRole(roleId: number, dto: UpdateRoleDto): Promise<RoleResponseDto> {
        // Kiểm tra role có tồn tại không
        const existed = await this.prisma.role.findUnique({
            where: { role_id: roleId }
        });

        if (!existed) {
            throw new NotFoundException(`Role với ID ${roleId} was not existed`);
        }

        // Nếu update role_code, kiểm tra trùng
        if (dto.roleCode && dto.roleCode !== existed.role_code) {
            const duplicateCode = await this.prisma.role.findUnique({
                where: { role_code: dto.roleCode }
            });

            if (duplicateCode) {
                throw new BadRequestException(`Role code ${dto.roleCode} was existed`);
            }
        }

        const role = await this.prisma.role.update({
            where: { role_id: roleId },
            data: {
                role_code: dto.roleCode,
                description: dto.description,
                permissions: dto.permissions
            }
        });

        return this.transformToDto(role);
    }

    // Xóa role
    async deleteRole(roleId: number): Promise<{ message: string }> {
        // Kiểm tra role có tồn tại không
        const existed = await this.prisma.role.findUnique({
            where: { role_id: roleId },
            include: {
                users: true
            }
        });

        if (!existed) {
            throw new NotFoundException(`Role với ID ${roleId} không tồn tại`);
        }

        // Kiểm tra có user nào đang sử dụng role này không
        if (existed.users.length > 0) {
            throw new BadRequestException(
                `Không thể xóa role này vì có ${existed.users.length} user đang sử dụng`
            );
        }

        await this.prisma.role.delete({
            where: { role_id: roleId }
        });

        return { message: `Đã xóa role ${existed.role_code} thành công` };
    }

    // Helper method để transform Prisma Role sang RoleResponseDto
    private transformToDto(role: any): RoleResponseDto {
        return {
            roleId: role.role_id,
            roleCode: role.role_code,
            description: role.description,
            permissions: role.permissions
        };
    }
}
