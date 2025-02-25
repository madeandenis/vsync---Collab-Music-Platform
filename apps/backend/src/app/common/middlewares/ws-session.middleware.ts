import { HttpStatus, NestMiddleware } from "@nestjs/common";
import { Request, Response } from 'express';
import { parseSessionCookie, getCookieValue } from "../utils/cookie.util";
import { WsException } from "@nestjs/websockets";
import { ConfigService } from "@nestjs/config";
import { validateCookieSignature } from "../utils/crypto.util";
import { UsersSessionCache } from "../../modules/cache/services/users-session-cache.service";
import { createLogger } from "../utils/logger.util";
import { respond } from "../utils/response.util";

export class WsSessionMiddleware implements NestMiddleware {

    private readonly logger = createLogger(WsSessionMiddleware.name);
    private cookieSecret;

    constructor(
        private readonly usersSessionCache: UsersSessionCache,
        private readonly configService: ConfigService
    ) 
    {
        this.cookieSecret = this.configService.get<string>('COOKIE_SECRET');
    }
    
    async use(req: Request, res: Response, next: Function) {
        if(req.headers?.upgrade === 'websocket')
        {
            try
            {
                const cookies = this.getCookies(req);
                const sessionCookie = this.getSessionCookie(cookies);
                const { sessionID, signature } = parseSessionCookie(sessionCookie);
                this.validateSessionCookie(sessionID, signature);
                const sessionData = await this.getSessionData(sessionID);
                
                req.session = sessionData;
                req.sessionID = sessionID;
                
                next();
            }
            catch(error)
            {
                this.logger.error(error, `WebSocket authentication failed`);
                respond(res).failure(HttpStatus.UNAUTHORIZED, 'Authentication failed. Please reconnect.');
                res.end(); 
            }
        }
        else
        {
            next();
        }
    }

    private async getSessionData(sessionID: string) {
        const sessionData = await this.usersSessionCache.get(sessionID);

        if (!sessionData) {
            throw new WsException(`Session does not exist`);
        }

        return sessionData;
    }


    private validateSessionCookie(sessionID, signature)
    {
        if (!sessionID || !signature) {
            throw new WsException(`Cookie data extraction failed`);
        }

        const validSignature = validateCookieSignature(sessionID, signature, this.cookieSecret);
        
        if (!validSignature) {
            throw new WsException('Signature validation failed');
        }

        return { sessionID, signature };
    }

    private getSessionCookie(cookies: string[])
    {
        const sessionCookie = getCookieValue('connect.sid', cookies);
        if (!sessionCookie) {
            throw new WsException('Session cookie missing');
        }
        return sessionCookie;
    }

    private getCookies(req: Request): string[] {
        const cookiesHeader = req.headers.cookie;
        if (!cookiesHeader) {
            throw new Error('Cookies not found in request headers');
        }
        return cookiesHeader.split(';').map(cookie => cookie.trim());
    }

}