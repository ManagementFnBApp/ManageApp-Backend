import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
} from '@nestjs/common';
import { PaymentAccountService } from './payment-account.service';
import {
  CreatePaymentAccountDto,
  UpdatePaymentAccountDto,
} from 'src/dtos/payment-account.dto';
import { GetUser, Roles } from 'src/decorators/decorators';
import { HttpMessage, Role } from 'src/global/globalEnum';
import { JwtPayloadDto } from 'src/dtos/login.dto';
import { ResponseData, ResponseType } from 'src/global/globalResponse';

@Controller('payment-account')
export class PaymentAccountController {
  constructor(private readonly paymentAccountService: PaymentAccountService) {}

  @Post()
  async create(
    @Body() createPaymentAccountDto: CreatePaymentAccountDto,
  ): Promise<ResponseType<any>> {
    return new ResponseData(
      await this.paymentAccountService.create(createPaymentAccountDto),
      HttpStatus.CREATED,
      HttpMessage.SUCCESS,
    );
  }

  @Roles(Role.SHOPOWNER)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @GetUser() user: JwtPayloadDto,
  ): Promise<ResponseType<any>> {
    return new ResponseData(
      await this.paymentAccountService.findOne(+id),
      HttpStatus.OK,
      HttpMessage.SUCCESS,
    );
  }

  @Roles(Role.SHOPOWNER)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePaymentAccountDto: UpdatePaymentAccountDto,
  ): Promise<ResponseType<any>> {
    return new ResponseData(
      await this.paymentAccountService.update(+id, updatePaymentAccountDto),
      HttpStatus.OK,
      HttpMessage.SUCCESS,
    );
  }

  @Roles(Role.SHOPOWNER)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ResponseType<any>> {
    return new ResponseData(
      await this.paymentAccountService.remove(+id),
      HttpStatus.OK,
      HttpMessage.SUCCESS,
    );
  }
}
