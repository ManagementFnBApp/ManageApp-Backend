import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class OrderItemService {
    constructor(
        private prisma: PrismaService
    ) {}
}