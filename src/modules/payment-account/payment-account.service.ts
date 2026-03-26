import { Injectable } from '@nestjs/common';
import { PrismaService } from 'db/prisma.service';
import { CreatePaymentAccountDto, UpdatePaymentAccountDto } from 'src/dtos/payment-account.dto';

@Injectable()
export class PaymentAccountService {
  constructor(
    private readonly prisma: PrismaService,
  ) {  }
  create(createPaymentAccountDto: CreatePaymentAccountDto) {
    return 'This action adds a new paymentAccount';
  }

  findOne(id: number) {
    return `This action returns a #${id} paymentAccount`;
  }

  update(id: number, updatePaymentAccountDto: UpdatePaymentAccountDto) {
    return `This action updates a #${id} paymentAccount`;
  }

  remove(id: number) {
    return `This action removes a #${id} paymentAccount`;
  }
}
