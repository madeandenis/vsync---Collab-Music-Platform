import { Events, GroupSession, QueuedTrack, ScoredTrack, Track, UserSession } from "@frontend/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface GroupSocketEventHandlers {
    onQueueUpdate: (queue: ScoredTrack[]) => void;
    onSessionUpdate: (session: GroupSession) => void;
    onNowPlayingUpdate: (nowPlaying: GroupSession['nowPlaying']) => void;
    onDisconnect: () => void;
    onError: (error: string) => void;
}

export interface GroupSocketActions {
    syncQueue: (updatedQueue: ScoredTrack[]) => void;
    syncSession: (updatedSession: GroupSession) => void;
    playback: {
        pause: (trackId: string, progressMs: number) => void;
        resume: (trackId: string, progressMs: number) => void;
        play: (trackId: string) => void;
        next: (trackId: string) => void;
        previous: (trackId: string) => void;
        seek: (trackId: string, seekPosition: number) => void;
    };
    queue: {
        add: (track: Track, score: number) => void;
        remove: (queuedTrack: QueuedTrack) => void;
        upvote: (queuedTrack: QueuedTrack) => void;
        downvote: (queuedTrack: QueuedTrack) => void;
        withdrawVote: (queuedTrack: QueuedTrack) => void;
    };
}

const useGroupSocket = (groupId: string, eventHandlers: GroupSocketEventHandlers) => {

    const [socket, setSocket] = useState<Socket | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!groupId) return;

        const newSocket = io("ws://localhost:5000/group/session", {
            query: { groupId },
            transports: ["websocket"],
            withCredentials: true
        });

        setSocket(newSocket);

        // Connection events
        newSocket.on(Events.Socket.DISCONNECT, eventHandlers.onDisconnect);

        newSocket.on(Events.Socket.ERROR, (error: string) => {
            setError(error);
            eventHandlers.onError(error);
        });

        newSocket.on(Events.Socket.CONNECT_ERROR, (error) => {
            const errorMessage = error.message || "Failed to connect to server";
            eventHandlers.onError(errorMessage);
            eventHandlers.onDisconnect();

        });

        // Group events
        newSocket.on(Events.Group.QUEUE, eventHandlers.onQueueUpdate);
        newSocket.on(Events.Group.SESSION, eventHandlers.onSessionUpdate);
        newSocket.on(Events.Track.NOW_PLAYING, eventHandlers.onNowPlayingUpdate);


        return () => {
            if (newSocket) {
                newSocket.off();
                newSocket.disconnect();
            }
        };

    }, [groupId]);

    const syncQueue = useCallback((updatedQueue: ScoredTrack[]) => {
        socket?.emit(Events.Group.UPDATE_QUEUE, updatedQueue);
    }, [socket]);

    const syncSession = useCallback((updatedSession: GroupSession) => {
        socket?.emit(Events.Group.EMIT_SESSION, updatedSession);
    }, [socket]);

    const createTrackEvent = (event: string) =>
        (trackId: string, progressMs: number = 0) => {
            socket?.emit(event, {
                trackId,
                progressMs,
                clientUpdatedAt: new Date().toISOString()
            });
        };

    const createQueuedTrackEvent = (event: string) =>
        (queuedTrack: QueuedTrack) => {
            socket?.emit(event, queuedTrack);
        };

    const actions: GroupSocketActions = {
        syncQueue,
        syncSession,
        playback: {
            pause: createTrackEvent(Events.Track.PAUSE),
            resume: createTrackEvent(Events.Track.RESUME),
            play: createTrackEvent(Events.Track.PLAY),
            next: createTrackEvent(Events.Track.NEXT),
            previous: createTrackEvent(Events.Track.PREVIOUS),
            seek: (trackId: string, seekPosition: number) => {
                socket?.emit(Events.Track.SEEK, {
                    trackId,
                    seekPosition,
                    clientUpdatedAt: new Date().toISOString()
                });
            }
        },
        queue: {
            add: (track: Track, score: number) => {
                socket?.emit(Events.Track.ADD, { track, score });
            },
            remove: createQueuedTrackEvent(Events.Track.REMOVE),
            upvote: createQueuedTrackEvent(Events.Track.UPVOTE),
            downvote: createQueuedTrackEvent(Events.Track.DOWNVOTE),
            withdrawVote: createQueuedTrackEvent(Events.Track.WITHDRAW_VOTE),
        }
    };

    return {
        socket: socket,
        error,
        actions
    };
}

export default useGroupSocket;