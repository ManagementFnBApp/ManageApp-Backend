import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { UserResponseDto } from "src/dtos/user.dto";

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
    ) { }

    async getAllUsers(): Promise<UserResponseDto[]> {
        return this.prisma.user.findMany();
    }
}