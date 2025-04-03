import { Events, GroupSession, QueuedTrack, ScoredTrack, Track } from "@frontend/shared";
import { useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface GroupSocketHook {
    groupId: string;
    onDisconnect: () => void;
    onConnectionError: (error: string) => void;
    onSocketError: (error: string) => void;
}

const useGroupSocket = ({ groupId, onDisconnect, onConnectionError, onSocketError }: GroupSocketHook) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [socketError, setSocketError] = useState<string | null>(null);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [session, setSession] = useState<GroupSession | null>(null);
    const [queue, setQueueState] = useState<ScoredTrack[]>([]);

    useEffect(() => {
        if (!groupId || connectionError) return;

        const newSocket = io("ws://localhost:5000/group/session", {
            query: { groupId },
            transports: ["websocket"],
            withCredentials: true
        });

        setSocket(newSocket);

        newSocket.on(Events.Socket.Disconnect, () => {
            onDisconnect()
        });

        newSocket.on(Events.Socket.Error, (error: string) => {
            setSocketError(error);
            onSocketError(error);
        });
    
        newSocket.on(Events.Socket.ConnectError, (error) => {
            const errorMessage = error.message || "Failed to connect to server";
            setConnectionError(errorMessage);
            onConnectionError(errorMessage);
        });

        newSocket.on(Events.Group.Queue, (queue: ScoredTrack[]) => {
            console.log('Received queue update:', queue);
            setQueueState(queue);
        });
        newSocket.on(Events.Group.Session, (session: GroupSession) => {
            setSession(session);
        });

        // TODO - Handle no active session error from the server

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };

    }, [groupId, connectionError]);

    const setQueue = useCallback((updatedQueue: ScoredTrack[]) => {
        setQueueState(updatedQueue);
        if (socket) {
            socket.emit(Events.Group.UpdateQueue, updatedQueue);
        }
    }, [socket]);

    const addTrack = useCallback((track: Track, score: number) => {
        if (socket) {
            socket.emit(Events.Track.Add, { track, score });
        }
    }, [socket])

    const upvoteTrack = useCallback((queuedTrack: QueuedTrack) => {
        if (socket) {
            socket.emit(Events.Track.UpVote, queuedTrack);
        }
    }, [socket]);
    const downvoteTrack = useCallback((queuedTrack: QueuedTrack) => {
        if (socket) {
            socket.emit(Events.Track.DownVote, queuedTrack);
        }
    }, [socket]);
    
    const withdrawTrack = useCallback((queuedTrack: QueuedTrack) => {
        if (socket) {
            socket.emit(Events.Track.WithdrawVote, queuedTrack);
        }
    }, [socket]);

    const removeTrack = useCallback((queuedTrack: QueuedTrack) => {
        if (socket) {
            socket.emit(Events.Track.Remove, queuedTrack);
        }
    }, [socket]);

    return { socketError, connectionError, queue, session, setQueue, addTrack, upvoteTrack, downvoteTrack, withdrawTrack, removeTrack };

}

export default useGroupSocket;