import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Request } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { CreateAdminDto, AdminResponseDto, UpdateAdminDto, AdminLoginDto } from "../../dtos/admin.dto";
import { ResponseData } from "../../global/globalResponse";
import { HttpMessage, HttpStatus } from "../../global/globalEnum";
import { Public } from "../../decorators/decorators";

@ApiTags('Admins')
@Controller('admins')
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    // Admin login
    @Public()
    @Post('login')
    @ApiOperation({ summary: 'Đăng nhập cho admin' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async adminLogin(@Body() dto: AdminLoginDto) {
        const result = await this.adminService.adminLogin(dto);
        return new ResponseData(result, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    }

    // Tạo admin đầu tiên (public) - chỉ cho phép tạo nếu chưa có admin nào
    @Public()
    @Post('initial')
    @ApiOperation({ summary: 'Tạo admin đầu tiên (chỉ khi chưa có admin nào)' })
    @ApiResponse({ status: 201, description: 'Admin created successfully' })
    @ApiResponse({ status: 400, description: 'Admin already exists' })
    async createInitialAdmin(@Body() dto: CreateAdminDto) {
        const adminCount = await this.adminService.getAdminCount();
        if (adminCount > 0) {
            return new ResponseData(
                null, 
                HttpStatus.ERROR, 
                'Đã có admin trong hệ thống. Vui lòng đăng nhập để tạo admin mới'
            );
        }

        const admin = await this.adminService.createAdmin(dto);
        return new ResponseData(admin, HttpStatus.CREATED_SUCCESS, HttpMessage.SUCCESS);
    }

    // Lấy tất cả admins
    @Get()
    @ApiOperation({ summary: 'Lấy danh sách tất cả admins' })
    @ApiResponse({ status: 200, description: 'Success' })
    async getAllAdmins() {
        const admins = await this.adminService.getAllAdmins();
        return new ResponseData<AdminResponseDto[]>(admins, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    }

    // Lấy admin theo ID
    @Get(':id')
    @ApiOperation({ summary: 'Lấy admin theo ID' })
    @ApiResponse({ status: 200, description: 'Success' })
    @ApiResponse({ status: 404, description: 'Admin not found' })
    async getAdminById(@Param('id', ParseIntPipe) id: number) {
        const admin = await this.adminService.getAdminById(id);
        return new ResponseData(admin, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    }

    // Tạo admin mới (cần auth)
    @Post()
    @ApiOperation({ summary: 'Tạo admin mới' })
    @ApiResponse({ status: 201, description: 'Admin created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async createAdmin(@Body() dto: CreateAdminDto, @Request() req) {
        // Lấy ID của admin đang tạo từ JWT token
        const creatorAdminId = req.user?.adminId || req.user?.id;
        const admin = await this.adminService.createAdmin(dto, creatorAdminId);
        return new ResponseData(admin, HttpStatus.CREATED_SUCCESS, HttpMessage.SUCCESS);
    }

    // Update admin
    @Put(':id')
    @ApiOperation({ summary: 'Cập nhật admin' })
    @ApiResponse({ status: 200, description: 'Admin updated successfully' })
    @ApiResponse({ status: 404, description: 'Admin not found' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async updateAdmin(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateAdminDto
    ) {
        const admin = await this.adminService.updateAdmin(id, dto);
        return new ResponseData(admin, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    }

    // Xóa admin
    @Delete(':id')
    @ApiOperation({ summary: 'Xóa admin' })
    @ApiResponse({ status: 200, description: 'Admin deleted successfully' })
    @ApiResponse({ status: 404, description: 'Admin not found' })
    @ApiResponse({ status: 400, description: 'Cannot delete admin with tenants' })
    async deleteAdmin(@Param('id', ParseIntPipe) id: number) {
        const result = await this.adminService.deleteAdmin(id);
        return new ResponseData(result, HttpStatus.SUCCESS, HttpMessage.SUCCESS);
    }
}
