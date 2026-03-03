import { Controller, UseGuards } from "@nestjs/common";
import { Roles, GetUser } from "src/decorators/decorators";
import { Role, HttpMessage, HttpStatus } from "src/global/globalEnum";
import { CategoryService } from "./category.service";
import { ResponseData, ResponseType } from "src/global/globalResponse";
import { AuthGuard } from "../auth/guard/auth.guard";

@Controller('categories')
@UseGuards(AuthGuard)
export class CategoryController {
    constructor(
        private readonly categoryService: CategoryService
    ) {}

    @Roles(Role.ADMIN)
    async createCategory(): Promise<void> {
        
    }
}