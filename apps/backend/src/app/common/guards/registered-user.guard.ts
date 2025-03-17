import { isGuestUserSession } from '@frontend/shared';
import { CanActivate, ExecutionContext, Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class RegisteredUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.session.user;
    
    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }
    
    if (isGuestUserSession(user)) {
      throw new ForbiddenException('Please log in with a full account.');
    }
    
    return true;
  }
}