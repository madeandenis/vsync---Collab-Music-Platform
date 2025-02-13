import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { isGuestUserSession } from '../../common/types/session.type';

@Injectable()
export class RegisteredUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.session.user;
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }
    if (isGuestUserSession(user)) {
      throw new ForbiddenException('Guest users cannot access this endpoint');
    }
    return true;
  }
}