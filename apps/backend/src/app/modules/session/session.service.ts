import { Request } from 'express';
import { TokenData, UserProfile } from '@frontend/shared';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Account, MusicPlatform } from '@prisma/client';
import { GuestUserSession, UserSession } from '../../common/types/session.type';
import { createLogger } from '../../common/utils/logger.util';

@Injectable()
export class SessionService {

    private readonly logger = createLogger(SessionService.name);

    createUserSession(
        req: Request,
        userAccount: Account,
        userProfile: UserProfile,
        tokenData: TokenData
    ): UserSession 
    {
        const account = {
            provider: userAccount.provider,
            providerAccountId: userAccount.providerAccountId,
            username: userProfile.display_name,
            avatarUrl: userProfile.images?.[0]?.url
        };

        return {
            userId: userAccount.userId,
            email: userProfile.email,
            sessionId: req.sessionID,
            lastActive: new Date().toISOString(),
            accounts: [
                account
            ],
            token: {
                accessToken: tokenData.access_token,
                expiresAt: tokenData.expires_in
                    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
                    : undefined
            },
            metadata: this.extractMetadata(req),
            activeAccount: account
        };
    }

    createGuestUserSession(
        req: Request,
        guestUserId: string
    ): GuestUserSession
    {
        return {
            guestUserId,
            sessionId: req.sessionID,
            lastActive: new Date().toISOString(),
            metadata: this.extractMetadata(req)
        }
    }

    setActiveAccount(session: UserSession, provider: MusicPlatform) {
        const activeAccount = session.accounts?.find(account => account.provider === provider);
        if (activeAccount) {
            session.activeAccount = activeAccount;
        }
    }

    saveSession(req: Request): Promise<void> {
        return new Promise((resolve, reject) => {
            req.session.save((error) => {
                if (error) {
                    this.logger.error(error, 'Session save error');
                    reject(new HttpException('Failed to save session', HttpStatus.INTERNAL_SERVER_ERROR));
                } else {
                    resolve();
                }
            });
        });
    }

    regenerateSession(req: Request): Promise<void> {
        return new Promise((resolve, reject) => {
            req.session.regenerate((error) => {
                if (error) {
                    this.logger.error(error, 'Session regeneration error');
                    reject(new HttpException('Failed to regenerate session', HttpStatus.INTERNAL_SERVER_ERROR));
                } else {
                    resolve();
                }
            });
        });
    }

    destroySession(req: Request): Promise<void> {
        return new Promise((resolve, reject) => {
            req.session.destroy((error) => {
                if (error) {
                    this.logger.error(error, 'Session destroy error');
                    reject(new HttpException('Failed to destroy session', HttpStatus.INTERNAL_SERVER_ERROR));
                } else {
                    resolve();
                }
            });
        });
    }

    private extractMetadata(req: Request)
    {
        return {
            sessionExpiry: new Date(Date.now() + 3600 * 1000).toISOString(), 
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || ''
        }
    }

}
