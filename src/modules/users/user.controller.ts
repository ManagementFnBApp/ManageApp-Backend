import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { UserService } from "./user.service";
import { CreateUserDto, UpdateUserDto, UserResponseDto, AssignRoleDto } from "../../dtos/user.dto";
import { ResponseData, ResponseType } from "src/global/globalResponse";
import { HttpMessage, HttpStatus } from "src/global/globalEnum";
import { Public, Roles } from "src/decorators/decorators";

@ApiTags('Users')
@Controller('users')
export class UserController {
    constructor(
        protected readonly userService: UserService,
    ) { }

    // @Roles('MANAGER')
    @Public()
    @Get()
    async getAllUsers(): Promise<ResponseType<UserResponseDto>> {
        return new ResponseData(await this.userService.getAllUsers(), HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    }

    @Public()
    @Post()
    @ApiTags('Create User')
    async createUser(@Body() body:CreateUserDto ): Promise<ResponseType<UserResponseDto>> {
        return new ResponseData(await this.userService.createUser(body), HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    }

    @Public()
    @Patch(':id')
    @ApiOperation({ summary: 'Cập nhật thông tin user' })
    @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
    async updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: UpdateUserDto
    ): Promise<ResponseType<UserResponseDto>> {
        return new ResponseData(await this.userService.updateUser(id, body), HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    }

    @Public()
    @Put(':id/role')
    @ApiOperation({ summary: 'Gán role ADMIN cho user - Không cần token (Public)' })
    @ApiResponse({ status: 200, description: 'Gán role thành công' })
    @ApiResponse({ status: 400, description: 'Chỉ được gán role ADMIN qua API này' })
    @ApiResponse({ status: 404, description: 'User hoặc Role không tồn tại' })
    async assignAdminRole(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AssignRoleDto
    ): Promise<ResponseType<UserResponseDto>> {
        return new ResponseData(await this.userService.assignAdminRole(id, dto), HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    }
}