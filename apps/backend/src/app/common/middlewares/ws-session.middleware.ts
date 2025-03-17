import { Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { ConfigService } from "@nestjs/config";
import { Socket } from 'socket.io';
import { parseSessionCookie, getCookieValue } from "../utils/cookie.util";
import { validateCookieSignature } from "../utils/crypto.util";
import { UsersSessionCache } from "../../modules/cache/services/users-session-cache.service";
import { createLogger } from "../utils/logger.util";

@Injectable()
export class WsSessionMiddleware {
    private readonly logger = createLogger(WsSessionMiddleware.name);
    private cookieSecret: string;

    constructor(
        private readonly usersSessionCache: UsersSessionCache,
        private readonly configService: ConfigService
    ) {
        this.cookieSecret = this.configService.get<string>('COOKIE_SECRET');
    }

    use(socket: Socket, next: (err?: Error) => void) {
        try {
            const cookies = this.getCookies(socket);
            const sessionCookie = this.getSessionCookie(cookies);
            const { sessionID, signature } = parseSessionCookie(sessionCookie);

            this.validateSessionCookie(sessionID, signature);

            this.getSessionData(sessionID)
                .then((sessionData) => {
                    socket.data.session = sessionData;
                    socket.data.sessionID = sessionID;

                    next();
                })
                .catch((error) => {
                    this.logger.error(error, 'Failed to fetch session data');
                    next(new WsException('Authentication failed. Please reconnect.'));
                });
        } catch (error) {
            this.logger.error(error, 'WebSocket authentication failed');
            next(new WsException('Authentication failed. Please reconnect.'));
        }
    }

    private async getSessionData(sessionID: string) {
        const sessionData = await this.usersSessionCache.get(sessionID);

        if (!sessionData) {
            throw new WsException('Session does not exist');
        }

        return sessionData;
    }

    private validateSessionCookie(sessionID: string, signature: string) {
        if (!sessionID || !signature) {
            throw new WsException('Cookie data extraction failed');
        }

        const validSignature = validateCookieSignature(sessionID, signature, this.cookieSecret);

        if (!validSignature) {
            throw new WsException('Signature validation failed');
        }
    }

    private getSessionCookie(cookies: string[]): string {
        const sessionCookie = getCookieValue('connect.sid', cookies);
        if (!sessionCookie) {
            throw new WsException('Session cookie missing');
        }
        return sessionCookie;
    }

    private getCookies(socket: Socket): string[] {
        const cookiesHeader = socket.handshake.headers.cookie;
        if (!cookiesHeader) {
            throw new WsException('Cookies not found in handshake headers');
        }
        return cookiesHeader.split(';').map(cookie => cookie.trim());
    }
}