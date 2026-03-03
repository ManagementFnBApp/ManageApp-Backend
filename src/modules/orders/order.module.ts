import { Module } from "@nestjs/common";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";
import { ProductModule } from "../products/product.module";
import { PrismaModule } from "db/prisma.module";

@Module({
    imports: [PrismaModule, ProductModule],
    controllers: [OrderController],
    providers: [OrderService],
    exports: [OrderService]
})
export class OrderModule { }