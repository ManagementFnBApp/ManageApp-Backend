import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ShiftService } from './shift.service';
import {
  AssignShiftDto,
  CreateShiftDto,
  UpdateShiftUserDto,
} from 'src/dtos/shift.dto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { GetUser, Public } from 'src/decorators/decorators';
import { Roles } from 'src/decorators/decorators';
import { ResponseData } from 'src/global/globalResponse';
import { HttpMessage, HttpStatus, Role } from 'src/global/globalEnum';

@Controller('shifts')
@UseGuards(AuthGuard)
export class ShiftController {
  constructor(private shiftService: ShiftService) { }

  // ──────────────────────────────────────────
  // Shift Templates
  // ──────────────────────────────────────────

  /**
   * POST /shifts
   * Tạo shift cố định (vd: Ca sáng, Ca chiều, Ca tối)
   */
  @Post()
  @Public()
  async createShift(@Body() dto: CreateShiftDto) {
    try {
      const data = await this.shiftService.createShift(dto);
      return new ResponseData(
        data,
        HttpStatus.CREATED_SUCCESS,
        HttpMessage.SUCCESS,
      );
    } catch (error) {
      return new ResponseData(null, HttpStatus.ERROR, error.message);
    }
  }

  /**
   * GET /shifts
   * Lấy tất cả shift templates
   */
  @Get()
  async getAllShifts() {
    try {
      const data = await this.shiftService.getAllShifts();
      return new ResponseData(data, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    } catch (error) {
      return new ResponseData(null, HttpStatus.ERROR, error.message);
    }
  }

  // ──────────────────────────────────────────
  // ShiftUser — SHOPOWNER quản lý
  // ──────────────────────────────────────────

  /**
   * POST /shifts/assign
   * SHOPOWNER gán shift cho nhân viên kèm notes
   */
  @Post('assign')
  @Roles(Role.SHOPOWNER)
  async assignShiftToStaff(
    @Body() dto: AssignShiftDto,
    @GetUser('shop_id') shop_id: number,
  ) {
    try {
      const data = await this.shiftService.assignShiftToStaff(dto, shop_id);
      return new ResponseData(
        data,
        HttpStatus.CREATED_SUCCESS,
        HttpMessage.SUCCESS,
      );
    } catch (error) {
      return new ResponseData(null, HttpStatus.ERROR, error.message);
    }
  }

  /**
   * GET /shifts/users
   * SHOPOWNER xem toàn bộ lịch shift của shop (chỉ active)
   */
  @Get('users')
  @Roles(Role.SHOPOWNER, Role.STAFF)
  async getShopShiftUsers(@GetUser('shop_id') shop_id: number) {
    try {
      const data = await this.shiftService.getShopShiftUsers(shop_id);
      return new ResponseData(data, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    } catch (error) {
      return new ResponseData(null, HttpStatus.ERROR, error.message);
    }
  }

  /**
   * GET /shifts/users/staff/:userId
   * Xem lịch shift của 1 nhân viên cụ thể
   */
  @Get('users/staff/:userId')
  @Roles(Role.SHOPOWNER, Role.STAFF)
  async getStaffShiftUsers(
    @Param('userId') userId: number,
    @GetUser('shop_id') shop_id: number,
  ) {
    try {
      const data = await this.shiftService.getStaffShiftUsers(userId, shop_id);
      return new ResponseData(data, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    } catch (error) {
      return new ResponseData(null, HttpStatus.ERROR, error.message);
    }
  }

  /**
   * PUT /shifts/users/:id
   * SHOPOWNER cập nhật notes của 1 assignment
   */
  @Put('users/:id')
  @Roles(Role.SHOPOWNER)
  async updateShiftUser(
    @Param('id') id: number,
    @Body() dto: UpdateShiftUserDto,
    @GetUser('shop_id') shop_id: number,
  ) {
    try {
      const data = await this.shiftService.updateShiftUser(id, dto, shop_id);
      return new ResponseData(data, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    } catch (error) {
      return new ResponseData(null, HttpStatus.ERROR, error.message);
    }
  }

  /**
   * DELETE /shifts/users/:id
   * SHOPOWNER xoá shift assignment
   */
  @Delete('users/:id')
  @Roles(Role.SHOPOWNER)
  async deactivateShiftUser(
    @Param('id') id: number,
    @GetUser('shop_id') shop_id: number,
  ) {
    try {
      const data = await this.shiftService.deleteShiftUser(id, shop_id);
      return new ResponseData(data, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    } catch (error) {
      return new ResponseData(null, HttpStatus.ERROR, error.message);
    }
  }
}
