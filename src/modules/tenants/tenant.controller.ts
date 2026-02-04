import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto, UpdateTenantDto, TenantResponseDto } from '../../dtos/tenant.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../decorators/decorators';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Tạo tenant mới' })
  @ApiResponse({
    status: 201,
    description: 'Tenant đã được tạo thành công',
    type: TenantResponseDto,
  })
  async createTenant(@Body() dto: CreateTenantDto): Promise<TenantResponseDto> {
    return this.tenantService.createTenant(dto);
  }

  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả tenants' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách tenants',
    type: [TenantResponseDto],
  })
  async getAllTenants(): Promise<TenantResponseDto[]> {
    return this.tenantService.getAllTenants();
  }

  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin tenant theo ID' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin tenant',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant không tồn tại' })
  async getTenantById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TenantResponseDto> {
    return this.tenantService.getTenantById(id);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin tenant' })
  @ApiResponse({
    status: 200,
    description: 'Tenant đã được cập nhật',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant không tồn tại' })
  async updateTenant(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantService.updateTenant(id, dto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa tenant' })
  @ApiResponse({ status: 204, description: 'Tenant đã được xóa' })
  @ApiResponse({ status: 404, description: 'Tenant không tồn tại' })
  async deleteTenant(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.tenantService.deleteTenant(id);
  }
}
