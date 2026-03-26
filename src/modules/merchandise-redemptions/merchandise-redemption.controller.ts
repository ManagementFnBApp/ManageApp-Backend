import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { MerchandiseRedemptionService } from './merchandise-redemption.service';
import { CreateRedemptionDto } from 'src/dtos/merchandise-redemption.dto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { GetUser, IsActive, Roles } from 'src/decorators/decorators';
import { ResponseData } from 'src/global/globalResponse';
import { HttpMessage, HttpStatus, Role } from 'src/global/globalEnum';

@IsActive()
@Controller('merchandise-redemptions')
@UseGuards(AuthGuard)
export class MerchandiseRedemptionController {
  constructor(private redemptionService: MerchandiseRedemptionService) { }

  /**
   * POST /merchandise-redemptions
   * Khách đổi quà bằng điểm tích lũy.
   */
  @Roles(Role.STAFF, Role.SHOPOWNER)
  @Post()
  async redeemMerchandise(
    @Body() dto: CreateRedemptionDto,
    @GetUser('shop_id') shop_id: number,
  ) {
    try {
      const data = await this.redemptionService.redeemMerchandise(dto, shop_id);
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
   * GET /merchandise-redemptions
   * Lịch sử đổi quà của cả shop.
   */
  @Roles(Role.STAFF, Role.SHOPOWNER)
  @Get()
  async getShopRedemptionHistory(@GetUser('shop_id') shop_id: number) {
    try {
      const data =
        await this.redemptionService.getShopRedemptionHistory(shop_id);
      return new ResponseData(data, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    } catch (error) {
      return new ResponseData(null, HttpStatus.ERROR, error.message);
    }
  }

  /**
   * GET /merchandise-redemptions/customer/:id
   * Lịch sử đổi quà của 1 khách hàng.
   */
  @Roles(Role.STAFF, Role.SHOPOWNER)
  @Get('customer/:id')
  async getCustomerRedemptionHistory(
    @Param('id') id: number,
    @GetUser('shop_id') shop_id: number,
  ) {
    try {
      const data = await this.redemptionService.getCustomerRedemptionHistory(
        id,
        shop_id,
      );
      return new ResponseData(data, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    } catch (error) {
      return new ResponseData(null, HttpStatus.ERROR, error.message);
    }
  }
}
