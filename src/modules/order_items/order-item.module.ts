import { Module } from "@nestjs/common";
import { PrismaModule } from '../../../prisma/prisma.module';
import { OrderItemService } from "./order-item.serivce";
import { OrderItemController } from "./order-item.controller";

@Module({
    imports: [PrismaModule],
    controllers: [OrderItemController],
    providers: [OrderItemService]
})

export class OrderItemModule {}