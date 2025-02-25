import { MusicPlatform } from "@prisma/client";
import { GuestUserSession, isUserSession, UserSession } from "./user-session.interface";

export interface Vote {
    trackId: string;
    voterId: string;
    weight: 1 | -1;
    timeStamp: string;
}

export interface Member {
    sessionId: string; // TODO - safe encrypt
    username: string;
    avatarUrl?: string;
    provider?: MusicPlatform;
    providerAccountUrl?: string; 
    role: 'admin' | 'authenticated' | 'guest';
    voteCount: number;
    joinTime: string;
}

export interface GroupSession {
    groupId: string;
    platform: MusicPlatform;
    members: Member[];
    votingHistory: Vote[];
    maxParticipants?: number;
    metadata: {
        sessionStart: string;
        lastUpdated: string;
        membersCount: number
    }
    settings: {
        votingSystem: 'upvote-only' | 'upvote-downvote';
        queueManagement: 'collaborative' | 'host-only';
        playbackControl: 'equal' | 'hierarchical';
    }
}

export const mapUserToMember = (session: UserSession | GuestUserSession): Member =>
    isUserSession(session)
      ? {
          sessionId: session.sessionId,
          username: session.activeAccount.username,
          avatarUrl: session.activeAccount.avatarUrl,
          provider: session.activeAccount.provider,
          providerAccountUrl: session.activeAccount.providerAccountUrl,
          role: session.isAdmin ? 'admin' : 'authenticated',
          voteCount: 0,
          joinTime: session.lastActive,
        }
      : {
          sessionId: session.sessionId,
          username: `Guest-${session.guestUserId.substring(0, 6)}`,
          role: 'guest',
          voteCount: 0,
          joinTime: session.lastActive,
        };