import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  AssignRoleDto,
  CreateManagedUserDto,
} from '../../dtos/user.dto';
import { ResponseData, ResponseType } from 'src/global/globalResponse';
import { HttpMessage, HttpStatus, Role } from 'src/global/globalEnum';
import { GetUser, Public, Roles } from 'src/decorators/decorators';
import { JwtPayloadDto } from 'src/dtos/login.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(protected readonly userService: UserService) { }

  @Roles(Role.ADMIN)
  @Get()
  async getAllUsers(): Promise<ResponseType<UserResponseDto>> {
    return new ResponseData(
      await this.userService.getAllUsers(),
      HttpStatus.SUCCESS,
      HttpMessage.SUCCESS,
    );
  }

  @Public()
  @Post()
  @ApiTags('Create User')
  async createUser(
    @Body() body: CreateUserDto,
  ): Promise<ResponseType<UserResponseDto>> {
    return new ResponseData(
      await this.userService.createUser(body),
      HttpStatus.SUCCESS,
      HttpMessage.SUCCESS,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin user' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
  ): Promise<ResponseType<UserResponseDto>> {
    return new ResponseData(
      await this.userService.updateUser(id, body),
      HttpStatus.SUCCESS,
      HttpMessage.SUCCESS,
    );
  }

  // API này sẽ xoá
  @Put(':id/role')
  @Public()
  @ApiOperation({
    summary: 'Gán role ADMIN cho user - Không cần token (Public)',
  })
  @ApiResponse({ status: 200, description: 'Gán role thành công' })
  @ApiResponse({
    status: 400,
    description: 'Chỉ được gán role ADMIN qua API này',
  })
  @ApiResponse({ status: 404, description: 'User hoặc Role không tồn tại' })
  async assignAdminRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignRoleDto,
  ): Promise<ResponseType<UserResponseDto>> {
    return new ResponseData(
      await this.userService.assignAdminRole(id, dto),
      HttpStatus.SUCCESS,
      HttpMessage.SUCCESS,
    );
  }
  @Post('managed')
  @ApiOperation({
    summary:
      'SHOPOWNER tao user mai (SHOPOWNER ho?c STAFF) cho shop - Cần login',
    description: 'SHOPOWNER tạo và gửi mail',
  })
  @ApiResponse({ status: 201, description: 'Tạo user thành công và gửi gmail' })
  @ApiResponse({ status: 400, description: '' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async createManagedUser(
    @Body() dto: CreateManagedUserDto,
    @Request() req: any,
  ): Promise<ResponseType<UserResponseDto>> {
    const userId = req.user?.id
    if (!userId) {
      throw new UnauthorizedException(
        'Không tìm thấy user_id vui lòng đăng nhập lại',
      );
    }

    return new ResponseData(
      await this.userService.createManagedUser(userId, dto),
      HttpStatus.SUCCESS,
      HttpMessage.SUCCESS,
    );
  }

  @Roles(Role.SHOPOWNER)
  @Get('managed')
  async getManagedUsers(@GetUser('') user: JwtPayloadDto): Promise<ResponseType<UserResponseDto[]>> {
    if (!user) {
      throw new UnauthorizedException('Bạn không thuộc shop nào. Vui lòng liên hệ quản trị viên.');
    }
    return new ResponseData<UserResponseDto[]>(await this.userService.getManagedUsers(user), HttpStatus.SUCCESS, HttpMessage.SUCCESS);
  }
}
