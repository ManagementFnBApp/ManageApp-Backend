import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "src/decorators/decorators";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();
        
        // Kiểm tra role
        const hasRole = requiredRoles.some((role) => user.role?.includes(role));
        if (!hasRole) {
            return false;
        }
        
        // Nếu role yêu cầu là SHOPOWNER, kiểm tra xem có phải SHOPOWNER gốc không
        if (requiredRoles.includes('SHOPOWNER')) {
            // Chỉ cho phép SHOPOWNER gốc (owner_manager_id = null)
            return user.ownerManagerId === null || user.ownerManagerId === undefined;
        }
        
        return true;
    }
}