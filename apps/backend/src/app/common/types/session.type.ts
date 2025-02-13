import { MusicPlatform } from "@prisma/client";

interface Account {
    provider: MusicPlatform;
    providerAccountId: string;
    username: string;
    avatarUrl?: string;
}

// TODO - encrypt tokens
interface AuthToken {
    accessToken?: string;
    expiresAt?: string; 
}

interface SessionMetadata {
    sessionExpiry: string; 
    ipAddress: string;
    userAgent: string;
}

export interface UserSession {
    userId: string;
    email?: string; 
    sessionId: string;
    lastActive: string; 
    accounts?: Account[]; 
    token?: AuthToken;
    metadata: SessionMetadata;
    activeAccount: Account;
}

export interface GuestUserSession {
    guestUserId: string;
    sessionId: string;
    lastActive: string;
    metadata: SessionMetadata;
}

export function isUserSession(session: any): session is UserSession {
    return (session as UserSession).userId !== undefined;
}

export function isGuestUserSession(session: any): session is GuestUserSession {
    return (session as GuestUserSession).guestUserId !== undefined;
}