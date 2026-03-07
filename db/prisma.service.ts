import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        // Thêm connect_timeout=30 để xử lý Neon serverless cold start
        const baseUrl = process.env.DATABASE_URL ?? '';
        const connectionString = baseUrl.includes('connect_timeout')
            ? baseUrl
            : `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}connect_timeout=30`;
        const adapter = new PrismaPg({ connectionString });
        super({ adapter });
    }
    async onModuleInit() {
        await this.$connect();
        // Warm up connection để tránh Neon cold start timeout ở request đầu tiên
        await this.$queryRaw`SELECT 1`;
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}