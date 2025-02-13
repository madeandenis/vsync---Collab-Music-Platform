import { UserProfile } from '@frontend/shared';
import { MusicPlatform } from '@prisma/client';

export class AccountDTO {
    userId: string;
    sessionId: string;
    provider: MusicPlatform;
    providerAccountId: string;
    username: string;
    avatarUrl?: string;
    refreshToken?: string;

    private constructor(
        userId: string,
        sessionId: string,
        provider: MusicPlatform,
        providerAccountId: string,
        username: string,
        avatarUrl?: string,
        refreshToken?: string
    ) {
        this.userId = userId;
        this.sessionId = sessionId;
        this.provider = provider;
        this.providerAccountId = providerAccountId;
        this.username = username;
        this.avatarUrl = avatarUrl;
        this.refreshToken = refreshToken;
    }

    static fromUserProfile(
        userId: string,
        sessionId: string,
        provider: MusicPlatform,
        userProfile: UserProfile,
        refreshToken?: string
    ): AccountDTO {
        return new AccountDTO(
            userId,
            sessionId,
            provider,
            userProfile.id,
            userProfile.display_name,
            userProfile.images?.[0]?.url,
            refreshToken
        );
    }
}
