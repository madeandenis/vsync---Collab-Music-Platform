import { GroupSession, QueuedTrack, ScoredTrack, Track } from "@frontend/shared";
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
    const [queue, setQueueState] = useState<ScoredTrack[] | null>(null);
    const [session, setSession] = useState<GroupSession | null>(null);

    useEffect(() => {
        if (!groupId || connectionError) return;

        const newSocket = io("ws://localhost:5000/group/session", {
            query: { groupId },
            transports: ["websocket"],
            withCredentials: true
        });

        setSocket(newSocket);

        newSocket.on("disconnect", () => {
            onDisconnect()
        });

        newSocket.on("error", (error: string) => {
            setSocketError(error);
            onSocketError(error);
        });
    
        newSocket.on("connect_error", (error) => {
            const errorMessage = error.message || "Failed to connect to server";
            setConnectionError(errorMessage);
            onConnectionError(errorMessage);
        });

        newSocket.on("group_queue", (queue: ScoredTrack[]) => {
            setQueueState(queue);
        });
        newSocket.on("group_session", (session: GroupSession) => {
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
            socket.emit("group_queue_updated", updatedQueue);
        }
    }, [socket]);

    const addTrack = useCallback((track: Track, score: number) => {
        if (socket) {
            socket.emit("add_track", { track, score });
        }
    }, [socket])

    const upvoteTrack = useCallback((queuedTrack: QueuedTrack) => {
        if (socket) {
            socket.emit("upvote_track", { queuedTrack });
        }
    }, [socket]);
    const downvoteTrack = useCallback((queuedTrack: QueuedTrack) => {
        if (socket) {
            socket.emit("downvote_track", { queuedTrack });
        }
    }, [socket]);

    return { socketError, connectionError, queue, setQueue, addTrack, upvoteTrack, downvoteTrack, session };

}

export default useGroupSocket;