import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_ADMIN_ONLY_KEY } from "src/decorators/decorators";

@Injectable()
export class AdminGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const isAdminOnly = this.reflector.getAllAndOverride<boolean>(IS_ADMIN_ONLY_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Nếu không phải endpoint yêu cầu admin only, cho phép qua
        if (!isAdminOnly) {
            return true;
        }

        // Nếu là admin only, check xem user có phải admin không
        const request = context.switchToHttp().getRequest();
        const user = request['user'];

        if (!user || user.type !== 'admin') {
            throw new UnauthorizedException('Chỉ admin mới có quyền truy cập endpoint này');
        }

        return true;
    }
}
