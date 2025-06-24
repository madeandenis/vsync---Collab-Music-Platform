import { BadRequestException, HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { MusicPlatform } from '@prisma/client';
import { createLogger } from '../../common/utils/logger.util';
import { GroupsSessionCache } from '../cache/services/groups-session-cache.service';
import { GroupSession, AuthenticatedUserSession } from '@frontend/shared';

@Injectable()
export class GroupsSesionService {

    private readonly logger = createLogger(GroupsSesionService.name);

    constructor(public readonly cache: GroupsSessionCache) { }

    // TODO!!! => add form options for visiility on the endpoint
    async createGroupSession(groupId: string, user: AuthenticatedUserSession, visibility: 'public' | 'private' = 'private') {
        try {
            const emptyGroupSession = this.initGroupSession(
                groupId,
                user.activeAccount.provider,
                user.userId,
                visibility
            );

            await this.cache.set(groupId, emptyGroupSession);
        }
        catch (error) {
            this.logger.error(error, `Failed to create session for group ID: ${groupId}`);
            throw new InternalServerErrorException(`An unexpected error occurred while creating the session. Please try again later.`);
        }
    }

    async endGroupSession(groupId: string) {
        try {
            await this.cache.delete(groupId);
        }
        catch (error) {
            this.logger.error(error, `Failed to remove session for group ID: ${groupId}`);
            throw new InternalServerErrorException(`An error occurred while ending the session. Please try again later.`);
        }
    }

    async updateGroupSessionSettings(
        groupId: string,
        session: GroupSession,
        settings: {
            maxParticipants?: number;
            votingSystem?: 'upvote-only' | 'upvote-downvote';
            queueManagement?: 'collaborative' | 'host-only';
            playbackControl?: 'equal' | 'hierarchical';
        }
    ): Promise<GroupSession> {
        try {
            const updatedSettings = {
                ...(session.settings && Object.keys(session.settings).length > 0 ? session.settings : this.defaultSettings),
                ...settings
            };
    
            const updatedSession: GroupSession = {
                ...session,
                settings: updatedSettings,
                timestamps: {
                    ...session.timestamps,
                    updatedAt: new Date().toISOString()
                }
            };
    
            await this.cache.set(groupId, updatedSession);
            return updatedSession;
        } catch (error) {
            this.logger.error(error, `Failed to update settings for group ID: ${groupId}`);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException(`An error occurred while updating session settings. Please try again later.`);
        }
    }
    

    defaultSettings = {
        maxParticipants: 10,
        votingMode: 'upvote-only',
        queueMode: 'host-only',
        playbackMode: 'hierarchical',
    } as GroupSession['settings'];

    initGroupSession(
        groupId: string,
        platform: MusicPlatform,
        hostAccountId: string, 
        visibility: 'public' | 'private', 
      ): GroupSession {
        const groupSession: GroupSession = {
          groupId,
          platform,
          visibility,
          hostAccountId,
          coHostsAccountId: {},
          participants: [], 
          votes: [],
          playbackHistory: [], 
          nowPlaying: null, 
          timestamps: {
            createdAt: new Date().toISOString(), 
            updatedAt: new Date().toISOString(), 
          },
          settings: this.defaultSettings, 
        };
    
        return groupSession;
      }

}
