import { Injectable } from '@nestjs/common';
import { PrismaService } from 'db/prisma.service';

@Injectable()
export class ShopService {
  constructor(private prisma: PrismaService) { }

  // Shop service methods will be added here as needed
  // Currently handling shop operations through ShopSubscriptionService
}
