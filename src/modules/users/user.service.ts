import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  AssignRoleDto,
  CreateManagedUserDto,
} from '../../dtos/user.dto';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'db/prisma.service';
import { JwtPayloadDto } from 'src/dtos/login.dto';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async getAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      include: {
        role: true,
        profile: true,
      },
    });
    return users.map((user) => this.transformToDto(user));
  }

  async getUserByUsername(username: string): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        role: true,
        profile: true,
      },
    });
    return user ? this.transformToDto(user) : null;
  }

  //CREATE USER
  async createUser(body: CreateUserDto): Promise<UserResponseDto> {
    const existed = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: body.email }, { username: body.username }],
      },
    });

    if (existed) {
      throw new BadRequestException('Email or username was existed');
    }

    // Tìm role nếu có role_id

    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(body.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: body.email,
        username: body.username,
        password: hashPassword,
      }
    });
    return this.transformToDto(user);
  }

  //UPDATE USER
  async updateUser(
    userId: number,
    body: UpdateUserDto,
  ): Promise<UserResponseDto> {
    // Kiểm tra xem user có tồn tại không
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException(`User với ID ${userId} không tồn tại`);
    }

    // Kiểm tra email/username có bị trùng không (nếu có update)
    if (body.email || body.username) {
      const duplicateUser = await this.prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } }, // Loại trừ user hiện tại
            {
              OR: [
                body.email ? { email: body.email } : {},
                body.username ? { username: body.username } : {},
              ],
            },
          ],
        },
      });

      if (duplicateUser) {
        throw new BadRequestException('Email hoặc username đã tồn tại');
      }
    }

    // Validate role_id nếu có
    if (body.role_id !== undefined && body.role_id !== null) {
      const roleExists = await this.prisma.role.findUnique({
        where: { id: body.role_id },
      });
      if (!roleExists) {
        throw new BadRequestException(
          `Role với ID ${body.role_id} không tồn tại`,
        );
      }
    }

    // Update user data
    const userData: any = {};
    if (body.email !== undefined) userData.email = body.email;
    if (body.username !== undefined) userData.username = body.username;
    if (body.shop_id !== undefined) userData.shop_id = body.shop_id;
    if (body.role_id !== undefined) userData.role_id = body.role_id;
    if (body.is_active !== undefined) userData.is_active = body.is_active;

    // Update profile data nếu có
    const profileData: any = {};
    if (body.full_name !== undefined) profileData.full_name = body.full_name;
    if (body.phone !== undefined) profileData.phone = body.phone;
    if (body.avatar !== undefined) profileData.avatar = body.avatar;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...userData,
        ...(Object.keys(profileData).length > 0 && {
          profile: {
            upsert: {
              create: profileData,
              update: profileData,
            },
          },
        }),
      },
      include: {
        role: true,
        profile: true,
      },
    });

    return this.transformToDto(updatedUser);
  }

  //ASSIGN ADMIN ROLE TO USER (Public API - không cần token)
  async assignAdminRole(
    userId: number,
    dto: AssignRoleDto,
  ): Promise<UserResponseDto> {
    // Kiểm tra user có tồn tại không
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User với ID ${userId} không tồn tại`);
    }

    // Kiểm tra role có tồn tại không
    const role = await this.prisma.role.findUnique({
      where: { id: dto.role_id },
    });

    if (!role) {
      throw new BadRequestException(`Role với ID ${dto.role_id} không tồn tại`);
    }

    // CHỈ CHO PHÉP GÁN ROLE ADMIN QUA API NÀY
    if (role.role_code !== 'ADMIN') {
      throw new BadRequestException(
        `API này chỉ dùng để gán role ADMIN. Role SHOPOWNER được tự động gán khi thanh toán subscription thành công.`,
      );
    }

    // Assign role ADMIN cho user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role_id: dto.role_id },
      include: {
        role: true,
        profile: true,
      },
    });

    return this.transformToDto(updatedUser);
  }

  // SHOPOWNER tạo user mới cho shop (SHOPOWNER hoặc STAFF)
  async createManagedUser(
    shopOwnerId: number,
    dto: CreateManagedUserDto,
  ): Promise<UserResponseDto> {
    // 1. Kiểm tra SHOPOWNER có tồn tại không
    const shopOwner = await this.prisma.user.findUnique({
      where: { id: shopOwnerId },
      include: { role: true },
    });

    if (!shopOwner) {
      throw new NotFoundException(`User với ID ${shopOwnerId} không tồn tại`);
    }

    // 2. Kiểm tra user gọi API phải là SHOPOWNER
    if (shopOwner.role?.role_code !== 'SHOPOWNER') {
      throw new BadRequestException(
        'Chỉ có SHOPOWNER mới được phép tạo user cho shop',
      );
    }

    // 3. Kiểm tra SHOPOWNER phải có shop_id
    if (!shopOwner.shop_id) {
      throw new BadRequestException(
        'SHOPOWNER chưa có shop. Vui lòng đăng ký subscription trước.',
      );
    }

    // 4. Validate role_code chỉ nhận SHOPOWNER hoặc STAFF
    if (dto.role_code !== 'SHOPOWNER' && dto.role_code !== 'STAFF') {
      throw new BadRequestException(
        'role_code chỉ được phép là SHOPOWNER hoặc STAFF',
      );
    }

    // 5. Kiểm tra role có tồn tại không
    const role = await this.prisma.role.findUnique({
      where: { role_code: dto.role_code },
    });

    if (!role) {
      throw new BadRequestException(
        `Role ${dto.role_code} chưa tồn tại. Vui lòng tạo role này trước khi sử dụng API này.`,
      );
    }

    // 6. Kiểm tra email/username đã tồn tại chưa
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (existingUser) {
      throw new BadRequestException('Email hoặc username đã tồn tại');
    }

    // 7. Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    // 8. Tạo user mới với owner_manager_id và shop_id của SHOPOWNER
    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: hashedPassword,
        role_id: role.id,
        shop_id: shopOwner.shop_id, // Gán shop_id của SHOPOWNER
        owner_manager_id: shopOwnerId, // Gán owner_manager_id là id của SHOPOWNER
        is_active: true,
      },
      include: {
        role: true,
        profile: true,
      },
    });

    // 9. Gửi email với username và password (plaintext password trước khi hash)
    try {
      await this.emailService.sendUserCredentials(
        dto.email,
        dto.username,
        dto.password,
      );
    } catch (error) {
      console.error('Lỗi khi gửi email:', error);
      // Không throw error để không block việc tạo user
      // User đã được tạo thành công, chỉ email không gửi được
    }

    return this.transformToDto(newUser);
  }

  async findOrCreate(data: {
    email: string;
    fullName: string;
  }): Promise<UserResponseDto> {
    let user = await this.prisma.user.findUnique({
      where: { email: data.email },
      include: {
        role: true,
        profile: true,
      },
    });

    // 2. Nếu chưa có thì tạo mới
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: data.email,
          username: data.email,
          password: '',
          profile: {
            create: {
              full_name: data.fullName,
            },
          },
        },
        include: {
          role: true,
          profile: true,
        },
      });
    }

    return this.transformToDto(user);
  }

  //UPDATE PASSWORD
  async updatePassword(userId: number, newPassword: string): Promise<void> {
    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(newPassword, salt);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashPassword,
      },
    });
  }

  //FIND BY EMAIL
  async getUserByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        profile: true,
      },
    });
    return user ? this.transformToDto(user) : null;
  }

  // SHOPOWNER lấy danh sách nhân viên trong shop của mình
  async getManagedUsers(shopOwnerId: number): Promise<UserResponseDto[]> {
    const shopOwner = await this.prisma.user.findUnique({
      where: { id: shopOwnerId },
      include: { role: true },
    });

    if (!shopOwner) {
      throw new NotFoundException(`User với ID ${shopOwnerId} không tồn tại`);
    }

    if (shopOwner.role?.role_code !== 'SHOPOWNER') {
      throw new BadRequestException(
        'Chỉ có SHOPOWNER mới được xem danh sách nhân viên',
      );
    }

    if (!shopOwner.shop_id) {
      throw new BadRequestException(
        'SHOPOWNER chưa có shop. Vui lòng đăng ký subscription trước.',
      );
    }

    const managedUsers = await this.prisma.user.findMany({
      where: {
        owner_manager_id: shopOwnerId,
      },
      include: {
        role: true,
        profile: true,
      },
    });

    return managedUsers.map((user) => this.transformToDto(user));
  }

  // Đếm số lượng user trong hệ thống
  async getUserCount(): Promise<number> {
    return this.prisma.user.count();
  }

  async getManagedUsers(user: JwtPayloadDto): Promise<UserResponseDto[]> {
    if (!user.shop_id) {
      throw new UnauthorizedException('Bạn không thuộc shop nào. Vui lòng liên hệ quản trị viên.');
    }
    const users = await this.prisma.user.findMany({
      where: {
        shop_id: user.shop_id,
        owner_manager_id: user.id,
      },
      include: { role: true, profile: true },
    });
    return users.map((u) => this.transformToDto(u));
  }

  // Helper method to transform Prisma User to UserResponseDto
  private transformToDto(user: any): UserResponseDto {
    return {
      user_id: user.id,
      shop_id: user.shop_id,
      owner_manager_id: user.owner_manager_id,
      role_id: user.role_id,
      email: user.email,
      username: user.username,
      password: user.password,
      is_active: user.is_active,
      last_login: user.last_login,
      role: user.role?.role_code || null,
      created_at: user.created_at,
      updated_at: user.updated_at,
      profile: user.profile
        ? {
            profile_id: user.profile.profile_id,
            full_name: user.profile.full_name,
            avatar: user.profile.avatar,
            phone: user.profile.phone,
            created_at: user.profile.created_at,
            updated_at: user.profile.updated_at,
          }
        : null,
    };
  }
}
