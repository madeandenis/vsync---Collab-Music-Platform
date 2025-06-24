import { AuthenticatedUserSession } from '@frontend/shared';
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class TokenExpirationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const userSession = request.session.user as AuthenticatedUserSession;

    if (!userSession || !userSession.token || !userSession.token.expiresAt) {
      throw new UnauthorizedException('No valid session or token found. Please log in.');
    }

    const currentTime = new Date().getTime();
    const tokenExpirationTime = new Date(userSession.token.expiresAt).getTime();

    if (isNaN(tokenExpirationTime)) {
      throw new UnauthorizedException('Invalid token expiration date.');
    }

    if (currentTime > tokenExpirationTime) {
      throw new UnauthorizedException('Your session has expired. Please log in again.');
    }

    return true;
  }
}