import { Module } from "@nestjs/common";
import { OrderItemService } from "./order-item.serivce";
import { OrderItemController } from "./order-item.controller";
import { PrismaModule } from "db/prisma.module";

@Module({
    imports: [PrismaModule],
    controllers: [OrderItemController],
    providers: [OrderItemService]
})

export class OrderItemModule { }