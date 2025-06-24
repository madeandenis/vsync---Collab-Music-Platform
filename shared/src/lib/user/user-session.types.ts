import { MusicPlatform } from "@prisma/client";

interface Account {
  provider: MusicPlatform;
  providerAccountId: string;
  providerAccountUrl: string;
  username: string;
  avatarUrl?: string;
}

interface AuthToken {
  accessToken?: string;
  expiresAt?: string; 
}

interface SessionMetadata {
  sessionExpiry: string; 
  ipAddress: string;
  userAgent: string;
}

interface BaseUserSession {
  sessionId: string;
  lastActive: string;
  metadata: SessionMetadata;
}

export interface AuthenticatedUserSession extends BaseUserSession {
  kind: 'authenticated';
  userId: string;
  email?: string;
  accounts?: Account[];
  token?: AuthToken;
  activeAccount: Account;
}

export interface GuestUserSession extends BaseUserSession {
  kind: 'guest';
  guestUserId: string;
}

export type UserSession = AuthenticatedUserSession | GuestUserSession;

export function isAuthenticatedUserSession(session: UserSession): session is AuthenticatedUserSession {
    return session.kind === 'authenticated';
  }
  
  export function isGuestUserSession(session: UserSession): session is GuestUserSession {
    return session.kind === 'guest';
  }
  