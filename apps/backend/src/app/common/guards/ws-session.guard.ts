import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthSocket } from '../interfaces/socket-session.interface';

@Injectable()
export class WsSessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<AuthSocket>();
    return !!client.session?.user;
  }
}