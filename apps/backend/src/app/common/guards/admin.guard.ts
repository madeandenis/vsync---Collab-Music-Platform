import { UserSession } from '@frontend/shared';
import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.session.user as UserSession;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!user.isAdmin) {
      throw new ForbiddenException('Access restricted to administrators only');
    }

    return true;
  }
}
