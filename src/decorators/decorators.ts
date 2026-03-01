import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";

//Decorator for Authentication
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

//Decorator for permission
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

//Decorator for Admin Only
export const IS_ADMIN_ONLY_KEY = 'isAdminOnly';
export const AdminOnly = () => SetMetadata(IS_ADMIN_ONLY_KEY, true);

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Nếu truyền data (vd: @GetUser('id')), chỉ trả về field đó
    // Nếu không truyền, trả về cả object user
    return data ? user?.[data] : user;
  },
);