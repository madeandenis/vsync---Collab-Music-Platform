import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { WsSessionMiddleware } from '../../common/middlewares/ws-session.middleware';
import { AuthSocket } from '../../common/interfaces/socket-session.interface';
import { GuestUserSession, UserSession } from '../../common/interfaces/user-session.interface';
import { GroupsSessionCache } from '../cache/services/groups-session-cache.service';
import { WsGroupSessionService } from './group-session-ws.service';
import { QueuedTrack, ScoredTrack, TrackQueueService } from '../cache/services/track-queue.service';
import { handleWsError } from '../../common/utils/response.util';
import { createLogger } from '../../common/utils/logger.util';
import { Track } from '@frontend/shared';
import { UseGuards } from '@nestjs/common';
import { WsSessionGuard } from '../../common/guards/ws-session.guard';

@WebSocketGateway({
    cors: { origin: '*'},
    transport: ['websocket'],
    namespace: 'group/session',
    middleware: WsSessionMiddleware
})
export class GroupSessionGateway implements OnGatewayConnection, OnGatewayDisconnect {
    
    private readonly logger = createLogger(GroupSessionGateway.name);
    @WebSocketServer() server: Server

    constructor(
        private readonly groupsSessionCache: GroupsSessionCache,
        private readonly groupSessionService: WsGroupSessionService,
        private readonly trackQueueService: TrackQueueService,
    ) {}

    async handleConnection(client: AuthSocket) {
        try
        {
            const session: UserSession | GuestUserSession = client.session?.user;
            if(!session)
            {
                throw new WsException('Authentication failed. Please reconnect.');    
            }

            var groupId = client.handshake.query.groupId as string;
            if (!groupId)
            {
                throw new WsException('Group ID is required.');
            }

            var groupSession = await this.groupsSessionCache.get(groupId); 
            if(!groupSession)
            {
                throw new WsException(`No active session found for group with ID '${groupId}'`);
            }

            await this.groupSessionService.addClientToSession(groupSession, client);
            this.groupsSessionCache.set(groupId, groupSession); 
            
            const members = groupSession.members;
            const tracks: ScoredTrack[] = await this.trackQueueService.getQueue(groupId);

            client.join(groupId);
            client.emit('group-session', groupSession);
            client.emit('group-queue', tracks);
            
            this.server.to(groupId).emit('group-members', members);

        }
        catch(error)
        { 
            this.logger.error(
                {
                    error,
                    clientId: client.id,
                    groupId
                },
                'Error during WebSocket connection'
            );
            handleWsError(client, error);
        }
    }

    async handleDisconnect(client: AuthSocket) {
        try
        {
            const groupId = client.handshake.query.groupId as string;
            let groupSession = await this.groupsSessionCache.get(groupId);
    
            if (!groupSession) {
                return;
            }
    
            this.groupSessionService.removeClientFromSession(groupSession, client);
            this.groupsSessionCache.set(groupId, groupSession);
    
            const members = groupSession.members;
            this.server.to(groupId).emit('group-members', members);
    
            client.leave(groupId);
        }
        catch(error)
        { 
            this.logger.error(
                {
                    error,
                    clientId: client.id,
                },
                'Error during WebSocket disconnection'
            );
            handleWsError(client, error);
        }

    }
    
    @SubscribeMessage('add-track')
    @UseGuards(WsSessionGuard)
    async handleAddTrack(client: AuthSocket, payload: { track: Track, score: number})
    {
        try
        {
            const groupId = client.handshake.query.groupId as string;
            const track = payload.track;
            const score = payload.score ?? 0;
            if (!track) {
                throw new WsException('Missing track data in the request');
            }

            var groupSession = await this.groupsSessionCache.get(groupId); 
            if(!groupSession)
            {
                throw new WsException(`No active session found for group with ID '${groupId}'`);
            }

            const user: UserSession | GuestUserSession = client.session.user;
            const queuedTrack = this.groupSessionService.createQueuedTrack(track, user);

            await this.trackQueueService.addTrack(groupId, {queuedTrack, score} as ScoredTrack);
            this.server.to(groupId).emit('group-new-track', { queuedTrack, score } as ScoredTrack);
        }
        catch(error)
        { 
            this.logger.error(
                {
                    error,
                    clientId: client.id,
                },
                'Error handling track addition request'
            );
            handleWsError(client, error);
        }
    }   

    @SubscribeMessage('upvote-track')
    @UseGuards(WsSessionGuard)
    async handleUpvoteTrack(client: AuthSocket, payload: { queuedTrack: QueuedTrack }) 
    {
        this.voteTrack(client, payload.queuedTrack, 1);
    }   

    @SubscribeMessage('downvote-track')
    @UseGuards(WsSessionGuard)
    async handleDownvoteTrack(client: AuthSocket, payload: { queuedTrack: QueuedTrack })
    {
        this.voteTrack(client, payload.queuedTrack, -1);
    }   

    private async voteTrack(client: AuthSocket, queuedTrack: QueuedTrack, voteWeight)
    {
        try
        {
            const groupId = client.handshake.query.groupId as string;

            if (!queuedTrack) {
                throw new WsException('Missing queuedTrack data in the request');
            }
    
            var groupSession = await this.groupsSessionCache.get(groupId); 
            if(!groupSession)
            {
                throw new WsException(`No active session found for group with ID '${groupId}'`);
            }
    
            
            const foundVote = this.groupSessionService.findUserVote(groupSession, client);
            
            if(!foundVote)
            {
                this.groupSessionService.recordTrackVote(groupSession, queuedTrack.trackDetails.id, voteWeight, client);
            }
            else
            {
                if(voteWeight !== foundVote.weight)
                {
                    foundVote.weight *= -1; // reverse vote
                    foundVote.timeStamp = new Date().toISOString();
                }
                else
                {
                    return;
                }
            }

            await this.trackQueueService.voteTrack(groupId, queuedTrack, voteWeight);
            await this.groupsSessionCache.set(groupId, groupSession);

            const updatedQueue: ScoredTrack[] = await this.trackQueueService.getQueue(groupId);
            client.emit('group-queue', updatedQueue);

        }
        catch(error)
        { 
            this.logger.error(
                {
                    error,
                    clientId: client.id,
                },
                'Error handling track voting request'
            );
            handleWsError(client, error);
        }
    }
    
}