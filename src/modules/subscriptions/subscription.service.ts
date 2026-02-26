import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateSubscriptionPaymentDto,
  UpdateSubscriptionPaymentStatusDto,
  SubscriptionPaymentResponseDto,
  CreateSubscriptionTenantDto,
  ChangeSubscriptionDto,
  SubscriptionTenantResponseDto,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionResponseDto,
} from '../../dtos/subscription.dto';
import { TenantService } from '../tenants/tenant.service';
import { RoleService } from '../roles/role.service';
import { AdminService } from '../admins/admin.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
    private roleService: RoleService,
    private adminService: AdminService,
  ) {}

  // ==================== SUBSCRIPTION METHODS ====================
  
  async createSubscription(dto: CreateSubscriptionDto): Promise<SubscriptionResponseDto> {
    const existed = await this.prisma.subscription.findUnique({
      where: { package_code: dto.packageCode },
    });

    if (existed) {
      throw new BadRequestException(`Package code ${dto.packageCode} đã tồn tại`);
    }

    const subscription = await this.prisma.subscription.create({
      data: {
        package_code: dto.packageCode,
        description: dto.description,
        price: dto.price,
        billing_cycle: dto.billingCycle,
        features: dto.features,
      },
    });

    return this.transformSubscriptionToDto(subscription);
  }

  async getAllSubscriptions(): Promise<SubscriptionResponseDto[]> {
    const subscriptions = await this.prisma.subscription.findMany();
    return subscriptions.map((sub) => this.transformSubscriptionToDto(sub));
  }

  async updateSubscription(id: number, dto: UpdateSubscriptionDto): Promise<SubscriptionResponseDto> {
    // Kiểm tra subscription có tồn tại không
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { subscription_id: id },
    });

    if (!existingSubscription) {
      throw new NotFoundException(`Subscription ID ${id} không tồn tại`);
    }

    // Nếu update package_code, kiểm tra xem có trùng với subscription khác không
    if (dto.packageCode && dto.packageCode !== existingSubscription.package_code) {
      const duplicatePackageCode = await this.prisma.subscription.findUnique({
        where: { package_code: dto.packageCode },
      });

      if (duplicatePackageCode) {
        throw new BadRequestException(`Package code ${dto.packageCode} đã tồn tại`);
      }
    }

    // Update subscription
    const updatedSubscription = await this.prisma.subscription.update({
      where: { subscription_id: id },
      data: {
        package_code: dto.packageCode,
        description: dto.description,
        price: dto.price,
        billing_cycle: dto.billingCycle,
        features: dto.features,
      },
    });

    return this.transformSubscriptionToDto(updatedSubscription);
  }

  async deleteSubscription(id: number): Promise<{ message: string }> {
    // Kiểm tra subscription có tồn tại không
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { subscription_id: id },
      include: {
        subscription_tenants: true,
      },
    });

    if (!existingSubscription) {
      throw new NotFoundException(`Subscription ID ${id} không tồn tại`);
    }

    // Kiểm tra xem có subscription tenant nào đang sử dụng không
    if (existingSubscription.subscription_tenants.length > 0) {
      throw new BadRequestException(
        `Không thể xóa subscription này vì đang có ${existingSubscription.subscription_tenants.length} tenant đang sử dụng. Vui lòng xóa hoặc chuyển các tenant sang gói khác trước.`
      );
    }

    // Xóa subscription
    await this.prisma.subscription.delete({
      where: { subscription_id: id },
    });

    return { message: `Subscription ID ${id} đã được xóa thành công` };
  }

  // ==================== SUBSCRIPTION TENANT METHODS ====================
  
  async createSubscriptionTenant(dto: CreateSubscriptionTenantDto, userId: number): Promise<SubscriptionTenantResponseDto> {
    // Kiểm tra subscription có tồn tại không
    const subscription = await this.prisma.subscription.findUnique({
      where: { subscription_id: dto.subscriptionId },
    });

    if (!subscription) {
      throw new BadRequestException(`Subscription ID ${dto.subscriptionId} không tồn tại`);
    }

    // Kiểm tra user có tồn tại không
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new BadRequestException(`User ID ${userId} không tồn tại`);
    }

    // VALIDATE: Kiểm tra xem user đã có subscription tenant nào chưa
    const expectedTenantName = `${user.username}'s Shop`;
    const existingTenant = await this.prisma.tenant.findFirst({
      where: {
        tenant_name: expectedTenantName,
      },
      include: {
        subscription_tenants: true,
      },
    });

    if (existingTenant && existingTenant.subscription_tenants.length > 0) {
      throw new BadRequestException(
        `Bạn đã có subscription tenant. Mỗi user chỉ được có 1 subscription tenant. Sub Tenant ID của bạn: ${existingTenant.subscription_tenants[0].sub_tenant_id}`
      );
    }

    // Tạo subscription tenant (chưa có tenant_id, sẽ được tạo sau khi payment success)
    // Tạm thời tạo tenant trước để có tenant_id
    const systemAdmin = await this.adminService.getOrCreateSystemAdmin();
    const tenant = await this.tenantService.createTenant({
      adminId: systemAdmin.adminId,
      tenantName: `${user.username}'s Shop`,
      loyalPointPerUnit: 1,
    });

    const subTenant = await this.prisma.subscriptionTenant.create({
      data: {
        subscription_id: dto.subscriptionId,
        tenant_id: tenant.tenant_id,
        number_of_renewals: 0,
        is_expired: false,
      },
    });

    return this.transformSubscriptionTenantToDto(subTenant);
  }

  async changeSubscription(
    subTenantId: number,
    dto: ChangeSubscriptionDto,
    userId: number,
  ): Promise<SubscriptionTenantResponseDto> {
    // Kiểm tra subscription tenant có tồn tại không
    const subTenant = await this.prisma.subscriptionTenant.findUnique({
      where: { sub_tenant_id: subTenantId },
      include: {
        tenant: {
          include: {
            users: true,
          },
        },
        subscription: true,
      },
    });

    if (!subTenant) {
      throw new NotFoundException(`Subscription tenant ID ${subTenantId} không tồn tại`);
    }

    // Kiểm tra subscription mới có tồn tại không
    const newSubscription = await this.prisma.subscription.findUnique({
      where: { subscription_id: dto.newSubscriptionId },
    });

    if (!newSubscription) {
      throw new NotFoundException(`Subscription ID ${dto.newSubscriptionId} không tồn tại`);
    }

    // Kiểm tra xem subscription có giống với subscription hiện tại không
    if (subTenant.subscription_id === dto.newSubscriptionId) {
      throw new BadRequestException(
        `Subscription tenant này đang sử dụng gói ${subTenant.subscription.package_code}. Không thể chuyển sang chính gói đó.`
      );
    }

    // Kiểm tra quyền: Chỉ SHOPOWNER của tenant đó hoặc Admin mới được chuyển
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException(`User ID ${userId} không tồn tại`);
    }

    // Check xem user có phải là owner của tenant này không
    const isOwner = subTenant.tenant.users.some(
      (u) => u.user_id === userId && u.tenant_id === subTenant.tenant_id && u.owner_manager_id === null
    );

    // Hoặc check xem user có role ADMIN không (nếu có logic Admin riêng)
    const isAdmin = user.role?.role_code === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new BadRequestException(
        `Bạn không có quyền chuyển subscription cho tenant này. Chỉ shop owner hoặc admin mới có quyền.`
      );
    }

    // Cập nhật subscription tenant
    const updatedSubTenant = await this.prisma.subscriptionTenant.update({
      where: { sub_tenant_id: subTenantId },
      data: {
        subscription_id: dto.newSubscriptionId,
        number_of_renewals: (subTenant.number_of_renewals || 0) + 1,
        is_expired: false, // Reset expired status khi chuyển gói mới
        updated_at: new Date(),
      },
    });

    console.log(
      `✅ Subscription tenant ${subTenantId} đã chuyển từ gói ${subTenant.subscription.package_code} sang gói ${newSubscription.package_code}`
    );

    return this.transformSubscriptionTenantToDto(updatedSubTenant);
  }

  // ==================== SUBSCRIPTION PAYMENT METHODS ====================
  
  async createSubscriptionPayment(dto: CreateSubscriptionPaymentDto, userId: number): Promise<SubscriptionPaymentResponseDto> {
    // Kiểm tra subscription tenant có tồn tại không
    const subTenant = await this.prisma.subscriptionTenant.findUnique({
      where: { sub_tenant_id: dto.subTenantId },
      include: { tenant: true },
    });

    if (!subTenant) {
      throw new BadRequestException(`Subscription tenant ID ${dto.subTenantId} không tồn tại`);
    }

    // Kiểm tra user có tồn tại không
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new BadRequestException(`User ID ${userId} không tồn tại`);
    }

    // VALIDATE: Kiểm tra xem subscription tenant này có thuộc về user đang login không
    // Cách 1: Check tenant_name có chứa username không
    const expectedTenantName = `${user.username}'s Shop`;
    if (subTenant.tenant.tenant_name !== expectedTenantName) {
      throw new BadRequestException(
        `Bạn không có quyền tạo payment cho subscription tenant này. Chỉ được tạo payment cho subscription tenant mà bạn đã tạo.`
      );
    }

    // Cách 2: Kiểm tra xem đã có payment thành công của user khác cho subscription tenant này chưa
    const existingSuccessPayment = await this.prisma.subscriptionPayment.findFirst({
      where: {
        sub_tenant_id: dto.subTenantId,
        payment_status: 'success',
      },
      include: {
        subscription_tenant: {
          include: {
            tenant: {
              include: {
                users: true,
              },
            },
          },
        },
      },
    });

    // Nếu đã có payment thành công, check xem user đó có phải là user hiện tại không
    if (existingSuccessPayment) {
      const tenantUsers = existingSuccessPayment.subscription_tenant.tenant.users;
      const isCurrentUserInTenant = tenantUsers.some(u => u.user_id === userId);
      
      if (!isCurrentUserInTenant) {
        throw new BadRequestException(
          `Subscription tenant này đã được kích hoạt bởi user khác. Bạn không thể tạo payment cho nó.`
        );
      }
    }

    // Tạo payment record
    const payment = await this.prisma.subscriptionPayment.create({
      data: {
        sub_tenant_id: dto.subTenantId,
        method: dto.method,
        amount: dto.amount,
        payment_status: dto.paymentStatus,
      },
      include: {
        subscription_tenant: {
          include: {
            tenant: true,
          },
        },
      },
    });

    // Nếu payment_status là success, tự động assign tenant và role cho user
    if (dto.paymentStatus === 'success') {
      await this.processSuccessfulPayment(payment.sub_payment_id, userId);
    }

    return this.transformPaymentToDto(payment, user);
  }

  async updateSubscriptionPaymentStatus(
    paymentId: number,
    dto: UpdateSubscriptionPaymentStatusDto,
  ): Promise<SubscriptionPaymentResponseDto> {
    // Kiểm tra payment có tồn tại không
    const payment = await this.prisma.subscriptionPayment.findUnique({
      where: { sub_payment_id: paymentId },
      include: {
        subscription_tenant: {
          include: {
            tenant: true,
            subscription: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ID ${paymentId} không tồn tại`);
    }

    // Update payment status
    const updatedPayment = await this.prisma.subscriptionPayment.update({
      where: { sub_payment_id: paymentId },
      data: { payment_status: dto.paymentStatus },
      include: {
        subscription_tenant: {
          include: {
            tenant: true,
          },
        },
      },
    });

    // Nếu status chuyển thành success, xử lý logic tạo tenant và assign role
    if (dto.paymentStatus === 'success' && payment.payment_status !== 'success') {
      // Tìm user dựa trên tenant
      const users = await this.prisma.user.findMany({
        where: { tenant_id: payment.subscription_tenant.tenant_id },
      });

      if (users.length > 0) {
        await this.processSuccessfulPayment(paymentId, users[0].user_id);
      }
    }

    return this.transformPaymentToDto(updatedPayment, null);
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private async processSuccessfulPayment(paymentId: number, userId: number): Promise<void> {
    // Lấy payment details
    const payment = await this.prisma.subscriptionPayment.findUnique({
      where: { sub_payment_id: paymentId },
      include: {
        subscription_tenant: {
          include: {
            tenant: true,
            subscription: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ID ${paymentId} không tồn tại`);
    }

    // Lấy user
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new BadRequestException(`User ID ${userId} không tồn tại`);
    }

    // 1. Lấy hoặc tạo role SHOPOWNER
    let shopOwnerRole;
    try {
      shopOwnerRole = await this.roleService.getRoleByCode('SHOPOWNER');
    } catch (error) {
      // Nếu role chưa tồn tại, tạo mới
      shopOwnerRole = await this.roleService.createRole({
        roleCode: 'SHOPOWNER',
        description: 'Shop Owner - Quản lý cửa hàng',
        permissions: null,
      });
    }

    // 2. Update user với tenant_id và role_id
    await this.prisma.user.update({
      where: { user_id: userId },
      data: {
        tenant_id: payment.subscription_tenant.tenant_id,
        role_id: shopOwnerRole.roleId,
        owner_manager_id: null, // Là SHOPOWNER gốc
      },
    });

    console.log(`✅ User ${user.username} đã được assign Tenant ${payment.subscription_tenant.tenant_id} và Role SHOPOWNER`);
  }

  // Transform helpers
  private transformSubscriptionToDto(subscription: any): SubscriptionResponseDto {
    return {
      subscription_id: subscription.subscription_id,
      package_code: subscription.package_code,
      description: subscription.description,
      price: parseFloat(subscription.price),
      billing_cycle: subscription.billing_cycle,
      features: subscription.features,
    };
  }

  private transformSubscriptionTenantToDto(subTenant: any): SubscriptionTenantResponseDto {
    return {
      sub_tenant_id: subTenant.sub_tenant_id,
      subscription_id: subTenant.subscription_id,
      tenant_id: subTenant.tenant_id,
      number_of_renewals: subTenant.number_of_renewals,
      created_at: subTenant.created_at,
      updated_at: subTenant.updated_at,
      is_expired: subTenant.is_expired,
    };
  }

  private transformPaymentToDto(payment: any, user: any): SubscriptionPaymentResponseDto {
    return {
      sub_payment_id: payment.sub_payment_id,
      sub_tenant_id: payment.sub_tenant_id,
      method: payment.method,
      amount: parseFloat(payment.amount),
      created_at: payment.created_at,
      payment_status: payment.payment_status,
      tenant: payment.subscription_tenant?.tenant
        ? {
            tenant_id: payment.subscription_tenant.tenant.tenant_id,
            tenant_name: payment.subscription_tenant.tenant.tenant_name,
          }
        : undefined,
      user: user
        ? {
            user_id: user.user_id,
            username: user.username,
            role: user.role?.role_code || null,
          }
        : undefined,
    };
  }
}
