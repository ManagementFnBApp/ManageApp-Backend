import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Roles, GetUser } from 'src/decorators/decorators';
import { Role, HttpMessage, HttpStatus } from 'src/global/globalEnum';
import { CategoryService } from './category.service';
import { ResponseData, ResponseType } from 'src/global/globalResponse';
import { AuthGuard } from '../auth/guard/auth.guard';
import {
  AdminCreateCategoryDto,
  ResponseCategoryDto,
} from 'src/dtos/category.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Categories')
@Controller('categories')
@UseGuards(AuthGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SHOPOWNER)
  async getAllCategories(): Promise<ResponseType<ResponseCategoryDto[]>> {
    const categories = await this.categoryService.getAll();
    return new ResponseData<ResponseCategoryDto[]>(
      categories,
      HttpStatus.SUCCESS,
      HttpMessage.SUCCESS,
    );
  }

  @Roles(Role.ADMIN)
  @Post()
  async createCategory(
    @Body() body: AdminCreateCategoryDto,
  ): Promise<ResponseType<ResponseCategoryDto>> {
    const category = await this.categoryService.createCategory(body);
    return new ResponseData(
      category,
      HttpStatus.CREATED_SUCCESS,
      HttpMessage.SUCCESS,
    );
  }
}
