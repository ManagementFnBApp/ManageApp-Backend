import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MerchandiseService } from './merchandise.service';
import { CreateMerchandiseDto, UpdateMerchandiseDto } from 'src/dtos/merchandise.dto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { GetUser } from 'src/decorators/decorators';
import { ResponseData } from 'src/global/globalResponse';
import { HttpMessage, HttpStatus } from 'src/global/globalEnum';

@Controller('merchandises')
@UseGuards(AuthGuard)
export class MerchandiseController {
  constructor(private merchandiseService: MerchandiseService) {}

  @Post()
  async createMerchandise(
    @Body() dto: CreateMerchandiseDto,
    @GetUser('shop_id') shop_id: number,
  ) {
    try {
      const data = await this.merchandiseService.createMerchandise(dto, shop_id);
      return new ResponseData(data, HttpStatus.CREATED_SUCCESS, HttpMessage.SUCCESS);
    } catch (error) {
      return new ResponseData(null, HttpStatus.ERROR, error.message);
    }
  }

  @Get()
  async getAllMerchandises(@GetUser('shop_id') shop_id: number) {
    try {
      const data = await this.merchandiseService.getAllMerchandises(shop_id);
      return new ResponseData(data, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    } catch (error) {
      return new ResponseData(null, HttpStatus.ERROR, error.message);
    }
  }

  @Get(':id')
  async getMerchandiseById(
    @Param('id') id: number,
    @GetUser('shop_id') shop_id: number,
  ) {
    try {
      const data = await this.merchandiseService.getMerchandiseById(id, shop_id);
      return new ResponseData(data, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    } catch (error) {
      return new ResponseData(null, HttpStatus.ERROR, error.message);
    }
  }

  @Put(':id')
  async updateMerchandise(
    @Param('id') id: number,
    @Body() dto: UpdateMerchandiseDto,
    @GetUser('shop_id') shop_id: number,
  ) {
    try {
      const data = await this.merchandiseService.updateMerchandise(id, dto, shop_id);
      return new ResponseData(data, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    } catch (error) {
      return new ResponseData(null, HttpStatus.ERROR, error.message);
    }
  }

  @Delete(':id')
  async deleteMerchandise(
    @Param('id') id: number,
    @GetUser('shop_id') shop_id: number,
  ) {
    try {
      const data = await this.merchandiseService.deleteMerchandise(id, shop_id);
      return new ResponseData(data, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    } catch (error) {
      return new ResponseData(null, HttpStatus.ERROR, error.message);
    }
  }
}
