import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
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
  private readonly logger = new Logger(ShiftService.name);

  constructor(private prisma: PrismaService) {}

  // ──────────────────────────────────────────
  // Shift Templates
  // ──────────────────────────────────────────

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

    const start = new Date(dto.start_time);
    const end = new Date(dto.end_time);
    if (end <= start)
      throw new BadRequestException('end_time must be after start_time.');

    const shiftUser = await this.prisma.shiftUser.create({
      data: {
        shift_id: dto.shift_id,
        user_id: dto.user_id,
        shop_id,
        start_time: start,
        end_time: end,
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
      where: { shop_id, is_active: true },
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
      where: { user_id: Number(user_id), shop_id, is_active: true },
      orderBy: { start_time: 'asc' },
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
    const existing = await this.findShiftUserInShop(id, shop_id);
    if (!existing.is_active)
      throw new BadRequestException(
        'Cannot update a deactivated shift assignment.',
      );

    const start = dto.start_time
      ? new Date(dto.start_time)
      : existing.start_time;
    const end = dto.end_time ? new Date(dto.end_time) : existing.end_time;
    if (end <= start)
      throw new BadRequestException('end_time must be after start_time.');

    const updated = await this.prisma.shiftUser.update({
      where: { id: Number(id) },
      data: { start_time: start, end_time: end },
      include: {
        shift: { select: { shift_name: true } },
        user: { select: { username: true } },
      },
    });
    return this.transformToUserDto(updated);
  }

  async deactivateShiftUser(
    id: number,
    shop_id: number,
  ): Promise<ShiftUserResponseDto> {
    const existing = await this.findShiftUserInShop(id, shop_id);
    if (!existing.is_active)
      throw new BadRequestException('Shift assignment is already deactivated.');

    const updated = await this.prisma.shiftUser.update({
      where: { id: Number(id) },
      data: { is_active: false, deactivated_at: new Date() },
      include: {
        shift: { select: { shift_name: true } },
        user: { select: { username: true } },
      },
    });
    return this.transformToUserDto(updated);
  }

  // ──────────────────────────────────────────
  // Cron: Tự động xóa ShiftUser is_active=false sau 30 ngày
  // ──────────────────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredShiftUsers() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const { count } = await this.prisma.shiftUser.deleteMany({
      where: { is_active: false, deactivated_at: { lte: cutoff } },
    });

    if (count > 0) {
      this.logger.log(
        `[ShiftCleanup] Deleted ${count} expired shift assignments.`,
      );
    }
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
      start_time: record.start_time?.toISOString(),
      end_time: record.end_time?.toISOString(),
      is_active: record.is_active,
      created_at: record.created_at?.toISOString(),
      deactivated_at: record.deactivated_at?.toISOString() ?? null,
    };
  }
}
