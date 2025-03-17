import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthSocket } from '../../common/interfaces/socket-session.interface';
import { GroupsSessionCache } from '../cache/services/groups-session-cache.service';
import { WsGroupSessionService } from './group-session-ws.service';
import { TrackQueueService } from '../cache/services/track-queue.service';
import { emitWebSocketError } from '../../common/utils/response.util';
import { createLogger } from '../../common/utils/logger.util';
import { GuestUserSession, QueuedTrack, ScoredTrack, Track, UserSession, Vote } from '@frontend/shared';
import { WsSessionMiddleware } from '../../common/middlewares/ws-session.middleware';
import { WsLoggingMiddleware } from '../../common/middlewares/ws-log.middleware';

enum Events {
    GroupQueue = 'group_queue',
    GroupSession = 'group_session',
    GroupQueueUpdated = 'group_queue_updated',
}

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

            this.emitToClient(Events.GroupQueue, tracks);
            this.emitToGroup(groupId, Events.GroupSession, groupSession); // Emmit to notify all members about the addition of a new member

        } catch (error) {
            this.handleWebSocketError(socket, error, 'Error during WebSocket connection');
        }
    }

    async handleDisconnect(socket: AuthSocket) {
        try {
            const groupId = this.getGroupId(socket);
            let groupSession = await this.groupsSessionCache.get(groupId);

            if (!groupSession) {
                return;
            }

            const removed = this.groupSessionService.removeMemberFromSession(groupSession, socket);
            if (removed) {
                await this.groupsSessionCache.set(groupId, groupSession);
                this.emitToGroup(groupId, Events.GroupSession, groupSession);
            }

            socket.leave(groupId);
        }
        catch (error) {
            this.handleWebSocketError(socket, error, 'Error during WebSocket disconnection');
        }

    }

    @SubscribeMessage('add_track')
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
            this.emitToGroup(groupId, Events.GroupQueue, updatedQueue);
        }
        catch (error) {
            this.handleWebSocketError(socket, error, 'Error handling track addition request');
        }
    }

    @SubscribeMessage(Events.GroupQueueUpdated)
    async handleUpdatedGroupQueue(socket: AuthSocket, queue: ScoredTrack[])
    {
        try
        {
            if (!queue) {
                throw new WsException('Missing queue data in the request');
            }

            const groupId = this.getGroupId(socket);
            await this.getGroupSession(groupId);

            this.adjustTrackScores(queue);

            await this.trackQueueService.updateQueue(groupId, queue);
            
            const updatedQueue: ScoredTrack[] = await this.trackQueueService.getQueue(groupId);
            
            this.emitToGroup(groupId, Events.GroupQueue, updatedQueue);
        }
        catch (error) {
            this.handleWebSocketError(socket, error, 'Error handling track voting request');
        }
    }

    @SubscribeMessage('upvote_track')
    async handleUpvoteTrack(socket: AuthSocket, payload: { queuedTrack: QueuedTrack }) {
        this.voteTrack(socket, payload.queuedTrack, 1);
    }

    @SubscribeMessage('downvote_track')
    async handleDownvoteTrack(socket: AuthSocket, payload: { queuedTrack: QueuedTrack }) {
        this.voteTrack(socket, payload.queuedTrack, -1);
    }

    private async voteTrack(socket: AuthSocket, queuedTrack: QueuedTrack, voteWeight: number) {
        try {
            
            if (!queuedTrack) {
                throw new WsException('Missing queuedTrack data in the request');
            }

            const groupId = this.getGroupId(socket);
            const groupSession = await this.getGroupSession(groupId);

            const voterId = socket.data.sessionID;
            const trackId = queuedTrack.trackDetails.id;
            const vote: Vote = this.groupSessionService.findVote(groupSession, voterId, trackId);

            if(vote)
            {
                // Vote is same as before
                if(voteWeight === vote.weight) return;

                this.trackQueueService.voteTrack(groupId, queuedTrack, voteWeight - vote.weight); // withdraw last vote & apply new vote

                this.groupSessionService.updateVoteWeight(groupSession, voterId, trackId, voteWeight);
            }
            else
            {
                this.trackQueueService.voteTrack(groupId, queuedTrack, voteWeight); // apply new vote
                this.groupSessionService.recordTrackVote(groupSession, voterId, trackId, voteWeight);
            }

            await this.groupsSessionCache.set(groupId, groupSession);
            const updatedQueue: ScoredTrack[] = await this.trackQueueService.getQueue(groupId);
            
            this.emitToGroup(groupId, 'Events', groupSession);
            this.emitToGroup(groupId, Events.GroupQueue, updatedQueue);
        }
        catch (error) {
            this.handleWebSocketError(socket, error, 'Error handling track voting request');
        }
    }

    private adjustTrackScores(queue: ScoredTrack[]) {
        for (let i = queue.length - 1; i > 0; i--) {
            if (queue[i - 1].score < queue[i].score) {
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