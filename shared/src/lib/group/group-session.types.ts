import { MusicPlatform } from "@prisma/client";
import { isAuthenticatedUserSession, UserSession } from "../user/user-session.types";
import { Track } from "../music/music-service.types";

export interface Vote {
    trackId: string;
    voterId: string;
    weight: number;
    timeStamp: string;
}

interface BaseParticipant {
  sessionId: string;
  username: string;
  avatarUrl?: string;
  voteCount: number;
  joinTime: string;
}

export interface AuthenticatedParticipant extends BaseParticipant {
  role: 'admin' | 'authenticated';
  linkedAccount: {
    provider: MusicPlatform;
    providerAccountUrl: string;
  };
}

export interface GuestParticipant extends BaseParticipant {
  role: 'guest';
  linkedAccount?: undefined; 
}

export type Participant = AuthenticatedParticipant | GuestParticipant;

export interface GroupSession {
    groupId: string;
    platform: MusicPlatform;
    visibility: 'public' | 'private';

    hostAccountId: string;
    coHostsAccountId: Record<string, Exclude<Participant['role'], 'guest'>>;
    
    participants: Participant[];

    votes: Vote[];
    playbackHistory: Array<{
        trackId: string;
        initiatedBy: string;
        playedAt: string;
    }>
      
    nowPlaying: null | {
        track: Track;
        state: 'playing' | 'paused';
        progressMs: number;
        initiatedBy: string;
        clientUpdatedAt: string;
        serverSyncedAt: string;
    };
    timestamps: {
        createdAt: string;
        updatedAt: string;
    }
    settings: {
        maxParticipants: number;
        votingMode: 'upvote-only' | 'upvote-downvote';
        queueMode: 'collaborative' | 'host-only';
        playbackMode: 'equal' | 'hierarchical';
        isVoteSystemEnabled: boolean;
        isQueueReorderingEnabled: boolean;
    }
}

export const mapUserSessionToParticipant = (userSession: UserSession, isAdmin: boolean): Participant =>
    isAuthenticatedUserSession(userSession)
      ? {
          sessionId: userSession.sessionId,
          username: userSession.activeAccount.username,
          avatarUrl: userSession.activeAccount.avatarUrl,
          linkedAccount: {
            provider: userSession.activeAccount.provider,
            providerAccountUrl: userSession.activeAccount.providerAccountUrl,
          },
          role: isAdmin ? 'admin' : 'authenticated',
          voteCount: 0,
          joinTime: userSession.lastActive,
        }
      : {
          sessionId: userSession.sessionId,
          username: `Guest-${userSession.guestUserId.substring(0, 6)}`,
          role: 'guest',
          voteCount: 0,
          joinTime: userSession.lastActive,
        };
  