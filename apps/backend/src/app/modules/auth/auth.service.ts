import { TokenData, UserProfile } from '@frontend/shared';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AccountsService } from '../accounts/accounts.service';
import { MusicPlatform } from '@prisma/client';
import { AccountDTO } from '../accounts/dto/accunt.dto';
import { Request } from 'express';
import { UsersSessionService } from '../users-session/users-session.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly accountsService: AccountsService,
        private readonly sessionService: UsersSessionService
    ){}

    async authenticate(req: Request, provider: MusicPlatform, tokenData: TokenData, userProfile: UserProfile)
    {
        const userId = (await this.usersService.upsertUser(userProfile.email, { id: true })).id;
        const userAccount = await this.accountsService.upsertAccount(
            AccountDTO.fromUserProfile(
                userId,
                req.sessionID,
                provider, 
                userProfile,
                tokenData.refresh_token
            )
        )
        req.session.user = this.sessionService.createUserSession(
            req,
            userAccount,
            userProfile,
            tokenData
        );
        await this.sessionService.saveSession(req);
    }
    
    async authenticateGuest(req: Request)
    {
        const sessionId = req.sessionID;
        const guestUser = await this.usersService.createGuestUser(sessionId);

        req.session.user = this.sessionService.createGuestUserSession(
            req,
            guestUser.id
        );
        await this.sessionService.saveSession(req);
    }
}
