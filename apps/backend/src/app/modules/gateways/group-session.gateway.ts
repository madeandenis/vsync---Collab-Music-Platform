import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthSocket } from '../../common/interfaces/socket-session.interface';
import { GroupsSessionCache } from '../cache/services/groups-session-cache.service';
import { WsGroupSessionService } from './group-session-ws.service';
import { TrackQueueService } from '../cache/services/track-queue.service';
import { emitWebSocketError } from '../../common/utils/response.util';
import { createLogger } from '../../common/utils/logger.util';
import { Events, GroupSession, GuestUserSession, QueuedTrack, ScoredTrack, Track, UserSession, Vote } from '@frontend/shared';
import { WsSessionMiddleware } from '../../common/middlewares/ws-session.middleware';
import { WsLoggingMiddleware } from '../../common/middlewares/ws-log.middleware';

@WebSocketGateway({
    cors: { origin: '*' },
    transport: ['websocket'],
    namespace: 'group/session',
})
export class GroupSessionGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {

    private readonly logger = createLogger(GroupSessionGateway.name);
    @WebSocketServer() server: Server

    constructor(
        private readonly groupsSessionCache: GroupsSessionCache,
        private readonly groupSessionService: WsGroupSessionService,
        private readonly trackQueueService: TrackQueueService,
        private readonly wsSessionMiddleware: WsSessionMiddleware,
        private readonly wsLoggingMiddleware: WsLoggingMiddleware,
    ) { }

    afterInit(server: Server) {
        server.use((socket, next) => this.wsSessionMiddleware.use(socket, next));
        server.use((socket, next) => this.wsLoggingMiddleware.use(socket, next));
    }

    async handleConnection(socket: AuthSocket) {
        try {
            const session: UserSession | GuestUserSession = socket.data.session?.user;
            if (!session) {
                throw new WsException("Authentication failed. Please reconnect.");
            }

            const groupId = this.getGroupId(socket);
            if (!groupId) {
                throw new WsException("Group ID is required.");
            }

            const groupSession = await this.getGroupSession(groupId);

            await this.groupSessionService.addClientToSession(groupSession, socket);
            await this.groupsSessionCache.set(groupId, groupSession);

            const tracks: ScoredTrack[] = await this.trackQueueService.getQueue(groupId);

            socket.join(groupId);

            this.emitToClient(Events.Group.Queue, tracks);
            this.emitToGroup(groupId, Events.Group.Session, groupSession); // Emmit to notify all members about the addition of a new member

        } catch (error) {
            this.handleWebSocketError(socket, error, 'Error during WebSocket connection');
        }
    }

    async handleDisconnect(socket: AuthSocket) {
        try {
            const groupId = this.getGroupId(socket);
            const groupSession = await this.groupsSessionCache.get(groupId);

            if (!groupSession) {
                return;
            }

            const removed = this.groupSessionService.removeMemberFromSession(groupSession, socket);
            if (removed) {
                await this.groupsSessionCache.set(groupId, groupSession);
                this.emitToGroup(groupId, Events.Group.Session, groupSession);
            }

            socket.leave(groupId);
        }
        catch (error) {
            this.handleWebSocketError(socket, error, 'Error during WebSocket disconnection');
        }

    }

    @SubscribeMessage(Events.Group.UpdateQueue)
    async handleUpdateGroupQueue(socket: AuthSocket, queue: ScoredTrack[])
    {
        try
        {
            if (!queue) {
                throw new WsException('Missing queue data in the request');
            }

            const groupId = this.getGroupId(socket);
            await this.getGroupSession(groupId);

            console.log('Queue updated', queue);

            this.adjustTrackScores(queue);

            await this.trackQueueService.updateQueue(groupId, queue);
            
            const updatedQueue: ScoredTrack[] = await this.trackQueueService.getQueue(groupId);
            
            this.emitToGroup(groupId, Events.Group.Queue, updatedQueue);
        }
        catch (error) {
            this.handleWebSocketError(socket, error, 'Error handling track voting request');
        }
    }

    @SubscribeMessage(Events.Track.Add)
    async handleAddTrack(socket: AuthSocket, payload: { track: Track, score: number }) {
        try {
            const { track, score } = payload;
            
            if (!track) {
                throw new WsException('Missing track data in the request');
            }
            
            const groupId = this.getGroupId(socket);
            await this.getGroupSession(groupId);

            const user: UserSession | GuestUserSession = socket.data.session.user;
            const queuedTrack = this.groupSessionService.createQueuedTrack(track, user);
            const scoredTrack = { queuedTrack, score } as ScoredTrack;

            const getTrackId = (scoredTrack: ScoredTrack) => scoredTrack.queuedTrack.trackDetails.id;
            
            const currentQueue: ScoredTrack[] = await this.trackQueueService.getQueue(groupId);
            const isTrackInQueue = currentQueue.some(track => getTrackId(track) === getTrackId(scoredTrack))

            if (isTrackInQueue) {
                throw new WsException('Track already exists in the queue');
            }

            await this.trackQueueService.addTrack(groupId, scoredTrack);

            const updatedQueue = [...currentQueue, scoredTrack];
            this.emitToGroup(groupId, Events.Group.Queue, updatedQueue);
        }
        catch (error) {
            this.handleWebSocketError(socket, error, 'Error handling track addition request');
        }
    }

    @SubscribeMessage(Events.Track.Remove)
    async handleRemoveTrack(socket: AuthSocket, queuedTrack: QueuedTrack) {
        if (!queuedTrack) {
            throw new WsException('Missing queuedTrack data in the request');
        }

        const groupId = this.getGroupId(socket);
        await this.getGroupSession(groupId); 

        await this.trackQueueService.removeTrack(groupId, queuedTrack);
        const updatedQueue: ScoredTrack[] = await this.trackQueueService.getQueue(groupId);

        this.emitToGroup(groupId, Events.Group.Queue, updatedQueue);
    }

    @SubscribeMessage(Events.Track.UpVote)
    async handleUpvoteTrack(socket: AuthSocket, queuedTrack: QueuedTrack ) {
        this.handleVoteAction(socket, queuedTrack, 'upvote');
    }

    @SubscribeMessage(Events.Track.DownVote)
    async handleDownvoteTrack(socket: AuthSocket, queuedTrack: QueuedTrack) {
        this.handleVoteAction(socket, queuedTrack, 'downvote');
    }

    @SubscribeMessage(Events.Track.WithdrawVote)
    async handleWithdrawVote(socket: AuthSocket, queuedTrack: QueuedTrack) {
        await this.handleVoteAction(socket, queuedTrack, 'withdraw');
    }

    private async handleVoteAction(socket: AuthSocket, queuedTrack: QueuedTrack, action: 'upvote' | 'downvote' | 'withdraw') {
        try {
            
            if (!queuedTrack) {
                throw new WsException('Missing queuedTrack data in the request');
            }

            const groupId = this.getGroupId(socket);
            const groupSession = await this.getGroupSession(groupId);
            const voterId = socket.data.sessionID;
            const trackId = queuedTrack.trackDetails.id;

            const existingVote: Vote = this.groupSessionService.findVote(groupSession, voterId, trackId);

            if (action === 'withdraw')
            {
                this.withdrawVote(
                    groupSession,
                    groupId,
                    queuedTrack,
                    existingVote
                );
            }
            else 
            {
                this.upvoteOrDownvote(
                    groupSession,
                    groupId,
                    queuedTrack,
                    voterId, trackId,
                    action,
                    existingVote
                );
            }

            await this.groupsSessionCache.set(groupId, groupSession);
            const updatedQueue: ScoredTrack[] = await this.trackQueueService.getQueue(groupId);
            
            this.emitToGroup(groupId, Events.Group.Session, groupSession);
            this.emitToGroup(groupId, Events.Group.Queue, updatedQueue);
        }
        catch (error) {
            this.handleWebSocketError(socket, error, 'Error handling track voting request');
        }
    }

    private withdrawVote(
        groupSession: GroupSession,
        groupId: string,
        queuedTrack: QueuedTrack,
        existingVote?: Vote,
    ) {
        
        if (!existingVote) return; // No vote to withdraw
    
        this.trackQueueService.voteTrack(groupId, queuedTrack, -existingVote.weight);
        this.groupSessionService.removeTrackVote(groupSession, existingVote.voterId, existingVote.trackId);
    }
    
    private upvoteOrDownvote(
        groupSession: GroupSession,
        groupId: string,
        queuedTrack: QueuedTrack,
        voterId: string,
        trackId: string,
        action: 'upvote' | 'downvote',
        existingVote?: Vote,
    ) {
        const voteWeight = action === 'upvote' ? 1 : -1;
    
        if (existingVote) {
            if (existingVote.weight === voteWeight) return; // No change needed
    
            // Remove previous vote weight & apply new vote (updates the vote history)
            this.trackQueueService.voteTrack(groupId, queuedTrack, voteWeight - existingVote.weight);
            this.groupSessionService.updateVoteWeight(groupSession, voterId, trackId, voteWeight);
        } else {
            // New vote
            this.trackQueueService.voteTrack(groupId, queuedTrack, voteWeight);
            this.groupSessionService.recordTrackVote(groupSession, voterId, trackId, voteWeight);
        }
    }

    private adjustTrackScores(queue: ScoredTrack[]) {
        for (let i = queue.length - 1; i > 0; i--) {
            if (queue[i - 1].score <= queue[i].score) {
                queue[i - 1].score = queue[i].score + 1;
            }
        }
    }

    private getGroupId(socket: Socket)
    {
        return socket.handshake.query.groupId as string;
    }

    private async getGroupSession(groupId: string)
    {
        const groupSession = await this.groupsSessionCache.get(groupId);
        if (!groupSession) {
            throw new WsException(`No active session found for group with ID '${groupId}'`);
        }
        return groupSession
    }

    private emitToClient = (event: string, data: any) => {
        this.server.emit(event, data);
    };

    private emitToGroup = (groupId: string, event: string, data: any) => {
        this.server.to(groupId).emit(event, data);
    };

    private handleWebSocketError(socket: Socket, error: unknown, context: string) {
        this.logger.error(
            {
                error,
                socketId: socket.id,
            },
            context
        );
        emitWebSocketError(socket, error);
    }

}