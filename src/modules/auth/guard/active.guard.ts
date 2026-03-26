import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_ACTIVE_KEY } from 'src/decorators/decorators';

@Injectable()
export class ActiveGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireActive = this.reflector.getAllAndOverride<boolean>(
      IS_ACTIVE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If the route doesn't have @IsActive(), allow access
    if (!requireActive) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user?.is_active) {
      throw new ForbiddenException(
        'Your shop is not active. Please contact admin to activate your shop.',
      );
    }

    return true;
  }
}
