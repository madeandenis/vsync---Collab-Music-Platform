import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { UserSession } from '../../common/interfaces/user-session.interface';
import { GroupSession } from '../../common/interfaces/group-session.interface';
import { MusicPlatform } from '@prisma/client';
import { createLogger } from '../../common/utils/logger.util';
import { GroupsSessionCache } from '../cache/services/groups-session-cache.service';

@Injectable()
export class GroupsSesionService {

    private readonly logger = createLogger(GroupsSesionService.name);
    
    constructor(private readonly groupSessionCache: GroupsSessionCache) {}

    async createGroupSession(groupId: string, user: UserSession)
    {
        if(this.groupSessionCache.has(groupId))
        {
            throw new BadRequestException(`A session already exists for group ID: ${groupId}`);
        }
        try
        {
            await this.groupSessionCache.set(
                groupId,
                this.initGroupSession(groupId, user.activeAccount.provider)
            )
        }
        catch(error)
        {   
            this.logger.error(error, `Failed to create session for group ID: ${groupId}`);
            throw new InternalServerErrorException(`An unexpected error occurred while creating the session. Please try again later.`);
        }
    }

    async endGroupSession(groupId: string) {
        if (!this.groupSessionCache.has(groupId)) {
            throw new BadRequestException(`No active session found for group ID: ${groupId}`);
        }
        try 
        {
            await this.groupSessionCache.delete(groupId);
        } 
        catch(error)
        {
            this.logger.error(error, `Failed to remove session for group ID: ${groupId}`);
            throw new InternalServerErrorException(`An error occurred while ending the session. Please try again later.`);
        }
    }
    
    initGroupSession(
        groupId: string,
        platform: MusicPlatform,
        maxParticipants?: number,
      ): GroupSession {
        const groupSession: GroupSession = {
          groupId,
          platform,
          members: [],
          votingHistory: [],
          metadata: {
            sessionStart: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            membersCount: 0
          },
          settings: {
            votingSystem: 'upvote-only', 
            queueManagement: 'host-only',
            playbackControl: 'hierarchical', 
        },
        };
    
        if (maxParticipants) {
          groupSession.maxParticipants = maxParticipants;
        }
    
        return groupSession;
    }

}
