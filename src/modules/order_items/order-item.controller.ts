import { Controller, Post } from "@nestjs/common";
import { OrderItemService } from "./order-item.serivce";
import { Roles } from "src/decorators/decorators";
import { Role } from "src/global/globalEnum";

@Controller('order-items')
export class OrderItemController {
    constructor(
        private readonly orderItemService: OrderItemService
    ) {}

    @Roles(Role.SHOP_OWNER)
    @Post()
    createOrderItem() {
        return '';
    }
}