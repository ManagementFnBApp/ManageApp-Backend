import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { RoleService } from "./role.service";
import { CreateRoleDto, RoleResponseDto, UpdateRoleDto } from "../../dtos/role.dto";
import { ResponseData, ResponseType } from "../../global/globalResponse";
import { HttpMessage, HttpStatus } from "../../global/globalEnum";
import { Public, Roles } from "../../decorators/decorators";

@ApiTags('Roles')
@Controller('roles')
export class RoleController {
    constructor(private readonly roleService: RoleService) {}

    // Lấy tất cả roles
    @Roles('SHOPOWNER')
    @Get()
    @ApiOperation({ summary: 'Lấy danh sách tất cả roles' })
    @ApiResponse({ status: 200, description: 'Success' })
    async getAllRoles() {
        const roles = await this.roleService.getAllRoles();
        return new ResponseData<RoleResponseDto[]>(roles, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    }

    // Lấy role theo ID
    @Roles('SHOPOWNER')
    @Get(':id')
    @ApiOperation({ summary: 'Lấy role theo ID' })
    @ApiResponse({ status: 200, description: 'Success' })
    @ApiResponse({ status: 404, description: 'Role not found' })
    async getRoleById(@Param('id', ParseIntPipe) id: number): Promise<ResponseData<RoleResponseDto>> {
        const role = await this.roleService.getRoleById(id);
        return new ResponseData(role, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    }

    // Tạo role mới
    // @Roles('SHOPOWNER')
    @Public()
    @Post()
    @ApiOperation({ summary: 'Tạo role mới' })
    @ApiResponse({ status: 201, description: 'Role created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async createRole(@Body() dto: CreateRoleDto): Promise<ResponseData<RoleResponseDto>> {
        const role = await this.roleService.createRole(dto);
        return new ResponseData(role, HttpStatus.CREATED_SUCCESS, HttpMessage.SUCCESS);
    }

    // Update role
    @Roles('SHOPOWNER')
    @Patch(':id')
    @ApiOperation({ summary: 'Cập nhật role' })
    @ApiResponse({ status: 200, description: 'Role updated successfully' })
    @ApiResponse({ status: 404, description: 'Role not found' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async updateRole(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateRoleDto
    ): Promise<ResponseData<RoleResponseDto>> {
        const role = await this.roleService.updateRole(id, dto);
        return new ResponseData(role, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    }

    // Xóa role
    @Roles('SHOPOWNER')
    @Delete(':id')
    @ApiOperation({ summary: 'Xóa role' })
    @ApiResponse({ status: 200, description: 'Role deleted successfully' })
    @ApiResponse({ status: 404, description: 'Role not found' })
    @ApiResponse({ status: 400, description: 'Cannot delete role with users' })
    async deleteRole(@Param('id', ParseIntPipe) id: number): Promise<ResponseData<{ message: string }>> {
        const result = await this.roleService.deleteRole(id);
        return new ResponseData(result, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    }
}
