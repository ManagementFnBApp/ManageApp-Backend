import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateMerchandiseDto,
  MerchandiseResponseDto,
  UpdateMerchandiseDto,
} from 'src/dtos/merchandise.dto';

@Injectable()
export class MerchandiseService {
  constructor(private prisma: PrismaService) {}

  async createMerchandise(
    data: CreateMerchandiseDto,
    shop_id: number,
  ): Promise<MerchandiseResponseDto> {
    const merchandise = await this.prisma.merchandise.create({
      data: {
        shop_id,
        merchandise_name: data.merchandise_name,
        description: data.description ?? null,
        sku: data.sku ?? null,
        barcode: data.barcode ?? null,
        point_required: data.point_required,
        total_quantity: data.total_quantity,
        is_active: data.is_active ?? true,
      },
    });
    return this.transformToDto(merchandise);
  }

  async getAllMerchandises(shop_id: number): Promise<MerchandiseResponseDto[]> {
    const merchandises = await this.prisma.merchandise.findMany({
      where: { shop_id },
      orderBy: { created_at: 'desc' },
    });
    return merchandises.map((m) => this.transformToDto(m));
  }

  async getMerchandiseById(
    id: number,
    shop_id: number,
  ): Promise<MerchandiseResponseDto> {
    const merchandise = await this.prisma.merchandise.findFirst({
      where: { id: Number(id), shop_id },
    });

    if (!merchandise) {
      throw new NotFoundException(`Merchandise with ID ${id} not found`);
    }

    return this.transformToDto(merchandise);
  }

  async updateMerchandise(
    id: number,
    data: UpdateMerchandiseDto,
    shop_id: number,
  ): Promise<MerchandiseResponseDto> {
    const existing = await this.prisma.merchandise.findFirst({
      where: { id: Number(id), shop_id },
    });

    if (!existing) {
      throw new NotFoundException(`Merchandise with ID ${id} not found`);
    }

    const merchandise = await this.prisma.merchandise.update({
      where: { id: Number(id) },
      data: {
        merchandise_name: data.merchandise_name,
        description: data.description,
        sku: data.sku,
        barcode: data.barcode,
        point_required: data.point_required,
        total_quantity: data.total_quantity,
        is_active: data.is_active,
      },
    });

    return this.transformToDto(merchandise);
  }

  async deleteMerchandise(
    id: number,
    shop_id: number,
  ): Promise<{ message: string }> {
    const existing = await this.prisma.merchandise.findFirst({
      where: { id: Number(id), shop_id },
    });

    if (!existing) {
      throw new NotFoundException(`Merchandise with ID ${id} not found`);
    }

    // Soft delete: chỉ set is_active = false để giữ lịch sử redemption
    await this.prisma.merchandise.update({
      where: { id: Number(id) },
      data: { is_active: false },
    });

    return { message: `Merchandise with ID ${id} has been deactivated` };
  }

  transformToDto(merchandise: any): MerchandiseResponseDto {
    return {
      id: merchandise.id,
      shop_id: merchandise.shop_id,
      merchandise_name: merchandise.merchandise_name,
      description: merchandise.description,
      sku: merchandise.sku,
      barcode: merchandise.barcode,
      point_required: merchandise.point_required,
      total_quantity: merchandise.total_quantity,
      is_active: merchandise.is_active,
      created_at: merchandise.created_at?.toISOString(),
      update_at: merchandise.update_at?.toISOString(),
    };
  }
}
