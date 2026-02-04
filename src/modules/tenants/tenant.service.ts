import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TenantResponseDto, CreateTenantDto, UpdateTenantDto } from '../../dtos/tenant.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async getAllTenants(): Promise<TenantResponseDto[]> {
    const tenants = await this.prisma.tenant.findMany({
      include: {
        admin: {
          select: {
            admin_id: true,
            email: true,
            full_name: true,
          },
        },
      },
    });
    return tenants.map(tenant => this.transformToDto(tenant));
  }

  async getTenantById(tenantId: number): Promise<TenantResponseDto> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { tenant_id: tenantId },
      include: {
        admin: {
          select: {
            admin_id: true,
            email: true,
            full_name: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant với ID ${tenantId} không tồn tại`);
    }

    return this.transformToDto(tenant);
  }

  async createTenant(dto: CreateTenantDto): Promise<TenantResponseDto> {
    // Kiểm tra admin có tồn tại không
    const admin = await this.prisma.admin.findUnique({
      where: { admin_id: dto.adminId },
    });

    if (!admin) {
      throw new BadRequestException(`Admin với ID ${dto.adminId} không tồn tại`);
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        admin_id: dto.adminId,
        tenant_name: dto.tenantName,
        loyal_point_per_unit: dto.loyalPointPerUnit,
      },
      include: {
        admin: {
          select: {
            admin_id: true,
            email: true,
            full_name: true,
          },
        },
      },
    });

    return this.transformToDto(tenant);
  }

  async updateTenant(
    tenantId: number,
    dto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    // Kiểm tra tenant có tồn tại không
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { tenant_id: tenantId },
    });

    if (!existingTenant) {
      throw new NotFoundException(`Tenant với ID ${tenantId} không tồn tại`);
    }

    const tenant = await this.prisma.tenant.update({
      where: { tenant_id: tenantId },
      data: {
        tenant_name: dto.tenantName,
        loyal_point_per_unit: dto.loyalPointPerUnit,
        is_active: dto.isActive,
      },
      include: {
        admin: {
          select: {
            admin_id: true,
            email: true,
            full_name: true,
          },
        },
      },
    });

    return this.transformToDto(tenant);
  }

  async deleteTenant(tenantId: number): Promise<void> {
    // Kiểm tra tenant có tồn tại không
    const tenant = await this.prisma.tenant.findUnique({
      where: { tenant_id: tenantId },
      include: {
        users: true,
        shops: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant với ID ${tenantId} không tồn tại`);
    }

    // Kiểm tra xem có users hoặc shops liên quan không
    if (tenant.users.length > 0) {
      throw new BadRequestException(
        `Không thể xóa tenant vì còn ${tenant.users.length} users liên quan`,
      );
    }

    if (tenant.shops.length > 0) {
      throw new BadRequestException(
        `Không thể xóa tenant vì còn ${tenant.shops.length} shops liên quan`,
      );
    }

    await this.prisma.tenant.delete({
      where: { tenant_id: tenantId },
    });
  }

  private transformToDto(tenant: any): TenantResponseDto {
    return plainToInstance(TenantResponseDto, {
      tenant_id: tenant.tenant_id,
      admin_id: tenant.admin_id,
      tenant_name: tenant.tenant_name,
      loyal_point_per_unit: tenant.loyal_point_per_unit,
      is_active: tenant.is_active,
      created_at: tenant.created_at,
      update_at: tenant.update_at,
    }, { excludeExtraneousValues: true });
  }
}
