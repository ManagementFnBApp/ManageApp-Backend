import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'db/prisma.service';
import {
  AssignShiftDto,
  CreateShiftDto,
  ShiftResponseDto,
  ShiftUserResponseDto,
  UpdateShiftUserDto,
} from 'src/dtos/shift.dto';

@Injectable()
export class ShiftService {
  constructor(private prisma: PrismaService) {}

  async createShift(dto: CreateShiftDto): Promise<ShiftResponseDto> {
    const existing = await this.prisma.shift.findUnique({
      where: { shift_name: dto.shift_name },
    });
    if (existing) {
      throw new BadRequestException(
        `Shift "${dto.shift_name}" already exists.`,
      );
    }
    const shift = await this.prisma.shift.create({
      data: { shift_name: dto.shift_name },
    });
    return { id: shift.id, shift_name: shift.shift_name };
  }

  async getAllShifts(): Promise<ShiftResponseDto[]> {
    const shifts = await this.prisma.shift.findMany({ orderBy: { id: 'asc' } });
    return shifts.map((s) => ({ id: s.id, shift_name: s.shift_name }));
  }

  // ──────────────────────────────────────────
  // ShiftUser — SHOPOWNER quản lý
  // ──────────────────────────────────────────

  async assignShiftToStaff(
    dto: AssignShiftDto,
    shop_id: number,
  ): Promise<ShiftUserResponseDto> {
    const shift = await this.prisma.shift.findUnique({
      where: { id: dto.shift_id },
    });
    if (!shift)
      throw new NotFoundException(
        `Shift template with ID ${dto.shift_id} not found.`,
      );

    const user = await this.prisma.user.findFirst({
      where: { id: dto.user_id, shop_id },
      select: { id: true, username: true },
    });
    if (!user)
      throw new NotFoundException(
        `User with ID ${dto.user_id} not found in this shop.`,
      );

    const shiftUser = await this.prisma.shiftUser.create({
      data: {
        shift_id: dto.shift_id,
        user_id: dto.user_id,
        date: dto.date,
        shop_id,
        notes: dto.notes ?? null,
      },
      include: {
        shift: { select: { shift_name: true } },
        user: { select: { username: true } },
      },
    });
    return this.transformToUserDto(shiftUser);
  }

  async getShopShiftUsers(shop_id: number): Promise<ShiftUserResponseDto[]> {
    const records = await this.prisma.shiftUser.findMany({
      where: { shop_id },
      orderBy: { created_at: 'desc' },
      include: {
        shift: { select: { shift_name: true } },
        user: { select: { username: true } },
      },
    });
    return records.map((r) => this.transformToUserDto(r));
  }

  async getStaffShiftUsers(
    user_id: number,
    shop_id: number,
  ): Promise<ShiftUserResponseDto[]> {
    const user = await this.prisma.user.findFirst({
      where: { id: Number(user_id), shop_id },
    });
    if (!user)
      throw new NotFoundException(
        `User with ID ${user_id} not found in this shop.`,
      );

    const records = await this.prisma.shiftUser.findMany({
      where: { user_id: Number(user_id), shop_id },
      orderBy: { created_at: 'desc' },
      include: {
        shift: { select: { shift_name: true } },
        user: { select: { username: true } },
      },
    });
    return records.map((r) => this.transformToUserDto(r));
  }

  async updateShiftUser(
    id: number,
    dto: UpdateShiftUserDto,
    shop_id: number,
  ): Promise<ShiftUserResponseDto> {
    await this.findShiftUserInShop(id, shop_id);

    const updated = await this.prisma.shiftUser.update({
      where: { id: Number(id) },
      data: { notes: dto.notes ?? null },
      include: {
        shift: { select: { shift_name: true } },
        user: { select: { username: true } },
      },
    });
    return this.transformToUserDto(updated);
  }

  async deleteShiftUser(
    id: number,
    shop_id: number,
  ): Promise<{ message: string }> {
    await this.findShiftUserInShop(id, shop_id);
    await this.prisma.shiftUser.delete({ where: { id: Number(id) } });
    return { message: `Shift assignment ${id} deleted successfully.` };
  }

  // ──────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────

  private async findShiftUserInShop(id: number, shop_id: number) {
    const record = await this.prisma.shiftUser.findFirst({
      where: { id: Number(id), shop_id },
    });
    if (!record)
      throw new NotFoundException(`Shift assignment with ID ${id} not found.`);
    return record;
  }

  private transformToUserDto(record: any): ShiftUserResponseDto {
    return {
      id: record.id,
      shift_id: record.shift_id,
      shift_name: record.shift?.shift_name ?? '',
      user_id: record.user_id,
      username: record.user?.username ?? '',
      shop_id: record.shop_id,
      notes: record.notes ?? null,
      created_at: record.created_at?.toISOString(),
    };
  }
}
