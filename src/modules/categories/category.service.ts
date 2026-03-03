import { Injectable } from "@nestjs/common";
import { PrismaService } from "db/prisma.service";

@Injectable()
export class CategoryService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    async createCategory(): Promise<void> {

    }
}