import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ServerTokenGuard implements CanActivate {
    constructor(private configService: ConfigService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const serverToken = this.configService.get<string>('X_SERVER_TOKEN');

        const token = request.headers['x-server-token'] || request.query.serverToken;

        if (token !== serverToken) {
            throw new UnauthorizedException('Access denied');
        }

        return true;
    }
}