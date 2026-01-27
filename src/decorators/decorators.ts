import { SetMetadata } from "@nestjs/common";
import { UserRole } from "src/modules/users/dtos/user.dto";

//Decorator for Authentication
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

//Decorator for permission
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);