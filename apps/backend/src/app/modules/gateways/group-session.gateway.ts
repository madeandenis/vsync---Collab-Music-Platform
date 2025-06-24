import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthSocket } from '../../common/interfaces/socket-session.interface';
import { GroupsSessionCache } from '../cache/services/groups-session-cache.service';
import { WsGroupSessionService } from './group-session-ws.service';
import { TrackQueueService } from '../cache/services/track-queue.service';
import { emitWebSocketError } from '../../common/utils/response.util';
import { createLogger } from '../../common/utils/logger.util';
import { Events, GroupSession, GuestUserSession, isAuthenticatedUserSession, QueuedTrack, ScoredTrack, AuthenticatedUserSession, Vote, UserSession, TrackStateChangePayload, SeekPayload, AddTrackPayload } from '@frontend/shared';
import { WsSessionMiddleware } from '../../common/middlewares/ws-session.middleware';
import { WsLoggingMiddleware } from '../../common/middlewares/ws-log.middleware';
import { ForbiddenException } from '@nestjs/common';
import { GroupsService } from '../groups/groups.service';
import { colorize } from 'json-colorizer';
import { GroupSessionSchema, QueueSchema, TrackStateChangePayloadSchema } from './gateway.schemas';
import { AddTrackPayloadSchema, QueuedTrackSchema, SeekPayloadSchema } from './gateway.schemas';

@WebSocketGateway({
    cors: { origin: '*' },
    transport: ['websocket'],
    namespace: 'group/session',
})
export class GroupSessionGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {

    private readonly logger = createLogger(GroupSessionGateway.name);
    @WebSocketServer() server: Server

    constructor(
        private readonly groupsService: GroupsService,
        private readonly groupsSessionCache: GroupsSessionCache,
        private readonly groupSessionService: WsGroupSessionService,
        private readonly trackQueueService: TrackQueueService,
        private readonly wsSessionMiddleware: WsSessionMiddleware,
        private readonly wsLoggingMiddleware: WsLoggingMiddleware,
    ) { }

    // Middleware setup after WebSocket server initialization
    afterInit(server: Server) {
        server.use((socket, next) => this.wsSessionMiddleware.use(socket, next));
        server.use((socket, next) => this.wsLoggingMiddleware.use(socket, next));
    }

    async handleConnection(socket: AuthSocket) {
        try {
            const userSession: UserSession = socket.data.session?.user;

            if (!userSession) {
                socket.disconnect(true);
                throw new WsException("Authentication failed. Please reconnect.");
            }

            const groupId = this.getGroupId(socket);

            const groupSession = await this.getGroupSession(groupId);

            await this.groupSessionService.addParticipantToSession(groupSession, userSession);
            await this.groupsSessionCache.set(groupId, groupSession);

            const tracks: ScoredTrack[] = await this.trackQueueService.getQueue(groupId);

            socket.join(groupId);

            this.emitToClient(Events.Group.QUEUE, tracks);
            this.emitToGroup(groupId, Events.Group.SESSION, groupSession);

            if (groupSession.nowPlaying) {
                this.emitToClient(Events.Track.NOW_PLAYING, groupSession.nowPlaying);
            }

        } catch (error) {
            this.handleWebSocketError(socket, error, 'Error during WebSocket connection');
        }
    }

    async handleDisconnect(socket: AuthSocket) {
        try {
            const groupId = this.getGroupId(socket);
            const groupSession = await this.getGroupSession(groupId);
            const userSession: UserSession = socket.data.session?.user;

            const removed = this.groupSessionService.removeParticipantFromSession(groupSession, userSession);
            if (removed) {
                await this.groupsSessionCache.set(groupId, groupSession);
                this.emitToGroup(groupId, Events.Group.SESSION, groupSession);
            }

            socket.leave(groupId);
        }
        catch (error) {
            this.handleWebSocketError(socket, error, 'Error during WebSocket disconnection');
        }

    }

    @SubscribeMessage(Events.Group.UPDATE_QUEUE)
    async handleUpdateGroupQueue(socket: AuthSocket, queuePayload: unknown) {
        try {
            const queue = QueueSchema.parse(queuePayload);

            const groupId = this.getGroupId(socket);
            const groupSession = await this.getGroupSession(groupId);

            this.groupSessionService.adjustTrackScores(queue);

            await this.trackQueueService.updateQueue(groupId, queue);

            if (groupSession.nowPlaying) {
                const trackStillInQueue = this.groupSessionService.findTrackInQueue(
                    queue,
                    groupSession.nowPlaying.track.id
                );

                if (!trackStillInQueue) {
                    this.groupSessionService.clearNowPlaying(groupSession);

                    await this.groupsSessionCache.set(groupId, groupSession);
                    this.emitToGroup(groupId, Events.Track.NOW_PLAYING, null);
                }
            }

            this.emitToGroup(groupId, Events.Group.QUEUE, queue);
        }
        catch (error) {
            this.handleWebSocketError(socket, error, 'Error handling track voting request');
        }
    }

    @SubscribeMessage(Events.Group.EMIT_SESSION)
    async handleEmmitSession(socket: AuthSocket, sessionPayload: unknown) {
        try {
            const updatedSession = GroupSessionSchema.parse(sessionPayload);

            const groupId = this.getGroupId(socket);
            const groupSession = await this.getGroupSession(groupId);
            const userSession: UserSession = socket.data.session?.user;

            if (await this.canControlPlayback(groupId, groupSession, userSession)) {
                this.emitToGroup(groupId, Events.Group.SESSION, updatedSession);
            }

        } catch (error) {
            this.handleWebSocketError(socket, error, 'Error handling group session update');
        }
    }

    @SubscribeMessage(Events.Track.PAUSE)
    async handlePauseTrack(
        socket: AuthSocket,
        payload: unknown
    ) {
        await this.handlePlayback(socket, payload, Events.Track.PAUSE);
    }
    @SubscribeMessage(Events.Track.RESUME)
    async handleResumeTrack(
        socket: AuthSocket,
        payload: unknown
    ) {
        await this.handlePlayback(socket, payload, Events.Track.RESUME);
    }

    @SubscribeMessage(Events.Track.PLAY)
    async handlePlayTrack(
        socket: AuthSocket,
        payload: unknown
    ) {
        await this.handlePlayback(socket, payload, Events.Track.PLAY);
    }
    @SubscribeMessage(Events.Track.NEXT)
    async handleNextTrack(
        socket: AuthSocket,
        payload: unknown
    ) {
        await this.handlePlayback(socket, payload, Events.Track.NEXT);
    }
    @SubscribeMessage(Events.Track.PREVIOUS)
    async handlePreviousTrack(
        socket: AuthSocket,
        payload: unknown
    ) {
        await this.handlePlayback(socket, payload, Events.Track.PREVIOUS);
    }

    private async handlePlayback(
        socket: AuthSocket,
        payload: unknown,
        event: string
    ) {
        const { trackId, progressMs, clientUpdatedAt }: TrackStateChangePayload = TrackStateChangePayloadSchema.parse(payload);

        const groupId = this.getGroupId(socket);
        const groupSession = await this.getGroupSession(groupId);

        const userSession: UserSession = socket.data.session.user;

        if (!(await this.canControlPlayback(groupId, groupSession, userSession))) {
            throw new WsException('You do not have permission to control playback');
        }

        const currentQueue = await this.trackQueueService.getQueue(groupId);

        // Check if the queue is empty
        if (!currentQueue || currentQueue.length === 0) {
            throw new WsException('Queue is empty');
        }

        const trackToUse = currentQueue.find(
            (t) => t.queuedTrack.trackDetails.id === trackId
        );

        if (!trackToUse) {
            this.logger.info(`Track not found in queue: ${trackId}`);
            throw new WsException('Track not found in the current queue');
        }

        const isCurrentTrack = 
            groupSession.nowPlaying &&
            groupSession.nowPlaying.track &&
            groupSession.nowPlaying.track.id === trackId;

        // Only check timestamp if nowPlaying exists
        if (groupSession.nowPlaying) {
            const currentUpdatedAt = new Date(groupSession.nowPlaying.serverSyncedAt).getTime();
            const clientTime = new Date(clientUpdatedAt).getTime();
            if (clientTime < currentUpdatedAt) {
                // Request is outdated
                return;
            }
        }

        switch (event) {
            case Events.Track.PAUSE:
            case Events.Track.RESUME:
                if (!isCurrentTrack) return;

                const state = event === Events.Track.PAUSE ? 'paused' : 'playing';

                this.groupSessionService.updateNowPlayingState(
                    groupSession,
                    state,
                    progressMs,
                    clientUpdatedAt,
                );
                break;

            case Events.Track.PLAY:
            case Events.Track.NEXT:
            case Events.Track.PREVIOUS:
                // Use setNowPlaying instead of updateNowPlayingState for these events
                const trackToPlay = trackToUse.queuedTrack.trackDetails;
                const playingState = 'playing';

                this.groupSessionService.setNowPlaying(
                    groupSession,
                    trackToPlay,
                    playingState,
                    progressMs,
                    userSession.sessionId,
                    clientUpdatedAt
                );

                this.groupSessionService.addToPlaybackHistory(
                    groupSession,
                    trackId,
                    userSession.sessionId
                );

                break;
            default:
                return;
        }

        await this.groupsSessionCache.set(groupId, groupSession);

        this.emitToGroup(groupId, Events.Track.NOW_PLAYING, groupSession.nowPlaying);

    }

    @SubscribeMessage(Events.Track.SEEK)
    async handleSeekEvent(
        socket: AuthSocket,
        payload: unknown
    ) {
        try {
            const { trackId, seekPosition, clientUpdatedAt }: SeekPayload = SeekPayloadSchema.parse(payload);

            const groupId = this.getGroupId(socket);
            const groupSession = await this.getGroupSession(groupId);

            const userSession: AuthenticatedUserSession | GuestUserSession = socket.data.session.user;

            const participant = groupSession.participants.find(m => m.sessionId === userSession.sessionId);
            if (!participant) {
                throw new ForbiddenException('User is not part of the session');
            }

            if (!(await this.canControlPlayback(groupId, groupSession, userSession))) {
                throw new WsException('You do not have permission to seek');
            }

            const currentQueue = await this.trackQueueService.getQueue(groupId);
            const foundTrack = currentQueue.find(t => t.queuedTrack.trackDetails.id === trackId);

            if (!foundTrack) {
                throw new WsException('Track not found in the current queue');
            }

            if (!groupSession.nowPlaying) {
                throw new WsException('No track is currently playing');
            }

            if (groupSession.nowPlaying.track.id !== trackId) {
                throw new WsException('You can only seek the currently playing track');
            }

            const currentUpdatedAt = new Date(groupSession.nowPlaying.serverSyncedAt).getTime();
            const clientTime = new Date(clientUpdatedAt).getTime();
            if (clientTime < currentUpdatedAt) {
                return;
            }

            this.groupSessionService.updateNowPlayingState(
                groupSession,
                groupSession.nowPlaying.state,
                seekPosition,
                clientUpdatedAt

            );

            await this.groupsSessionCache.set(groupId, groupSession);

            this.emitToGroup(groupId, Events.Track.NOW_PLAYING, groupSession.nowPlaying);

        } catch (error) {
            this.handleWebSocketError(socket, error, 'Error handling track seek request');
        }
    }

    @SubscribeMessage(Events.Track.ADD)
    async handleAddTrack(socket: AuthSocket, payload: unknown) {
        try {
            const { track, score }: AddTrackPayload = AddTrackPayloadSchema.parse(payload);

            const groupId = this.getGroupId(socket);
            await this.getGroupSession(groupId);

            const userSession: AuthenticatedUserSession | GuestUserSession = socket.data.session.user;

            const queuedTrack = this.groupSessionService.createQueuedTrack(track, userSession);
            const scoredTrack = { queuedTrack, score } as ScoredTrack;

            const currentQueue: ScoredTrack[] = await this.trackQueueService.getQueue(groupId);

            const isTrackInQueue = currentQueue.some(track => this.getTrackId(track) === this.getTrackId(scoredTrack))
            if (isTrackInQueue) {
                throw new WsException('Track already exists in the queue');
            }

            await this.trackQueueService.addTrack(groupId, scoredTrack);

            const updatedQueue = [scoredTrack, ...currentQueue].sort(
                (a, b) => b.score - a.score
            );

            this.emitToGroup(groupId, Events.Group.QUEUE, updatedQueue);
        }
        catch (error) {
            this.handleWebSocketError(socket, error, 'Error handling track addition request');
        }
    }

    @SubscribeMessage(Events.Track.REMOVE)
    async handleRemoveTrack(socket: AuthSocket, queuedTrackPayload: unknown) {

        const queuedTrack: QueuedTrack = QueuedTrackSchema.parse(queuedTrackPayload);

        const groupId = this.getGroupId(socket);
        const groupSession = await this.getGroupSession(groupId);

        await this.trackQueueService.removeTrack(groupId, queuedTrack);
        const updatedQueue: ScoredTrack[] = await this.trackQueueService.getQueue(groupId);

        // If the removed track was the currently playing one, clear it
        if (groupSession.nowPlaying && groupSession.nowPlaying.track.id === queuedTrack.trackDetails.id) {

            this.groupSessionService.clearNowPlaying(groupSession);
            await this.groupsSessionCache.set(groupId, groupSession);

            this.emitToGroup(groupId, Events.Track.NOW_PLAYING, groupSession.nowPlaying);
        }

        this.emitToGroup(groupId, Events.Group.QUEUE, updatedQueue);
    }

    @SubscribeMessage(Events.Track.UPVOTE)
    async handleUpvoteTrack(
        socket: AuthSocket,
        queuedTrackPayload: unknown
    ) {
        await this.handleVote(socket, queuedTrackPayload, 'upvote');
    }

    @SubscribeMessage(Events.Track.DOWNVOTE)
    async handleDownvoteTrack(
        socket: AuthSocket,
        queuedTrackPayload: unknown
    ) {
        await this.handleVote(socket, queuedTrackPayload, 'downvote');
    }

    @SubscribeMessage(Events.Track.WITHDRAW_VOTE)
    async handleWithdrawVote(
        socket: AuthSocket,
        queuedTrackPayload: unknown
    ) {
        await this.handleVote(socket, queuedTrackPayload, 'withdraw');
    }

    async handleVote(socket: AuthSocket, queuedTrackPayload: unknown, action: 'upvote' | 'downvote' | 'withdraw') {
        try {
            const queuedTrack: QueuedTrack = QueuedTrackSchema.parse(queuedTrackPayload);

            const groupId = this.getGroupId(socket);
            const groupSession = await this.getGroupSession(groupId);
            const voterId = socket.data.sessionID;
            const trackId = queuedTrack.trackDetails.id;

            const existingVote: Vote = this.groupSessionService.findVote(groupSession, voterId, trackId);

            if (action === 'withdraw') {
                this.withdrawVote(
                    groupSession,
                    groupId,
                    queuedTrack,
                    existingVote
                );
            }
            else {
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

            this.emitToGroup(groupId, Events.Group.SESSION, groupSession);
            this.emitToGroup(groupId, Events.Group.QUEUE, updatedQueue);
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


    private async isGroupOwner(groupId: string, userSession: UserSession): Promise<boolean> {
        if (!isAuthenticatedUserSession(userSession)) {
            return false;
        }

        try {
            const group = await this.groupsService.findUserGroup(groupId, userSession.userId);
            return !!group;
        } catch {
            return false;
        }
    }

    private async canControlPlayback(groupId: string, groupSession: GroupSession, userSession: UserSession): Promise<boolean> {
        const queueManagement = groupSession.settings.queueMode;

        // In collaborative mode, any member can control playback
        if (queueManagement === 'collaborative') {
            return true;
        }

        // For non-collaborative mode, only the group owner can control
        return (await this.isGroupOwner(groupId, userSession));
    }

    // -- Getters --

    private getTrackId = (scoredTrack: ScoredTrack) => scoredTrack.queuedTrack.trackDetails.id;

    private getGroupId(socket: AuthSocket) {
        const groupId = socket.handshake.query.groupId as string;

        if (!groupId || groupId.trim() === "") {
            throw new WsException("Oops! We couldn't find a Group ID for this connection. Please ensure you're connecting to the right group.");
        }

        return groupId;
    }

    private async getGroupSession(groupId: string) {
        const groupSession = await this.groupsSessionCache.get(groupId);

        if (!groupSession) {
            throw new WsException(`No active session found for group with ID '${groupId}'`);
        }

        return groupSession;
    }

    // -- Emitters --

    private emitToClient = (event: string, data: any) => {
        this.server.emit(event, data);
    };

    private emitToGroup = (groupId: string, event: string, data: any) => {
        this.server.to(groupId).emit(event, data);
    };

    // -- Handlers --

    private handleWebSocketError(socket: Socket, error: unknown, context: string) {
        this.logger.info(
            colorize(JSON.stringify({
                socketId: socket.id,
                context,
                error
            }))
        );
        emitWebSocketError(socket, error);
    }

}