import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "db/prisma.service";

/**
 * Guard để kiểm tra xem subscription của shop có hết hạn không
 * Chặn SHOPOWNER và STAFF truy cập các API shop khi subscription expired
 * EXCEPT: Cho phép truy cập các API subscription để renew
 */
@Injectable()
export class SubscriptionExpiredGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prisma: PrismaService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Nếu không có user (chưa login), bỏ qua guard này
        // AuthGuard sẽ xử lý việc authentication
        if (!user) {
            return true;
        }

        // Cho phép các API subscription và auth để user có thể renew
        const path = request.route?.path || request.url;
        if (path && (path.includes('/subscriptions') || path.includes('/auth'))) {
            return true;
        }

        // Lấy userId từ token (sub là user ID)
        const userId = user.sub || user.userId;
        if (!userId) {
            return true;
        }

        // QUERY DATABASE để lấy thông tin user thực tế (không dựa vào token)
        const dbUser = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                role: true,
            },
        });

        if (!dbUser) {
            return true;
        }

        // Chỉ check cho SHOPOWNER và STAFF
        const roleCode = dbUser.role?.role_code;
        if (!roleCode || (roleCode !== 'SHOPOWNER' && roleCode !== 'STAFF')) {
            // Không phải SHOPOWNER/STAFF, bỏ qua check
            return true;
        }

        // Lấy shop_id từ database
        const shopId = dbUser.shop_id;
        if (!shopId) {
            // User chưa có shop, bỏ qua check
            return true;
        }

        // Kiểm tra subscription của shop
        const shopSubscription = await this.prisma.shopSubscription.findFirst({
            where: {
                shop_id: shopId,
            },
            orderBy: {
                created_at: 'desc', // Lấy subscription mới nhất
            },
            include: {
                subscription: true,
            },
        });

        // Nếu shop không có subscription (trường hợp đặc biệt), cho phép truy cập
        if (!shopSubscription) {
            return true;
        }

        // Kiểm tra is_expired
        if (shopSubscription.is_expired) {
            // Tính số ngày đã expired
            const now = new Date();
            const endDate = new Date(shopSubscription.end_date || new Date());
            const daysExpired = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));

            throw new ForbiddenException(
                `Subscription của shop đã hết hạn vào ${shopSubscription.end_date?.toLocaleDateString('vi-VN')} ` +
                `(${daysExpired} ngày trước). ` +
                `Vui lòng gia hạn gói ${shopSubscription.subscription.package_code} để tiếp tục sử dụng. ` +
                `Lưu ý: Shop sẽ bị xóa vĩnh viễn sau ${14 - daysExpired} ngày nữa nếu không gia hạn.`
            );
        }

        return true;
    }
}
