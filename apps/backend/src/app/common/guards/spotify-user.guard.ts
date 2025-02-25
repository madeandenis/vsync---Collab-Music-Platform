import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { MusicPlatform } from '@prisma/client';
import { UserSession } from '../interfaces/user-session.interface';

@Injectable()
export class SpotifyUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.session.user as UserSession;
    
    if (user?.activeAccount?.provider !== MusicPlatform.Spotify) {
        throw new ForbiddenException('Access restricted to Spotify users only');
    }
    
    return true;
  }
}