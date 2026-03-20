import { Injectable } from '@nestjs/common';
import { PrismaService } from 'db/prisma.service';
import {
  AdminCreateCategoryDto,
  ResponseCategoryDto,
} from 'src/dtos/category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<ResponseCategoryDto[]> {
    return await this.prisma.category.findMany();
  }

  async getById(id: number): Promise<ResponseCategoryDto | null> {
    return await this.prisma.category.findUnique({
      where: {
        id,
      },
    });
  }

  async createCategory(
    body: AdminCreateCategoryDto,
  ): Promise<ResponseCategoryDto> {
    const category = await this.prisma.category.create({
      data: {
        category_name: body.category_name,
        is_active: true,
      },
    });
    return category;
  }
}
