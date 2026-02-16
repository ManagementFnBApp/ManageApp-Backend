import { SetMetadata } from "@nestjs/common";

//Decorator for Authentication
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

//Decorator for permission
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

//Decorator for Admin Only
export const IS_ADMIN_ONLY_KEY = 'isAdminOnly';
export const AdminOnly = () => SetMetadata(IS_ADMIN_ONLY_KEY, true);