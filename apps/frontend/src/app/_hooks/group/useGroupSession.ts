import { GroupSession, ScoredTrack, Track } from "@frontend/shared";
import { useCallback, useState } from "react";
import { useAlertContext } from "../../contexts/alertContext";
import useGroupSocket, { GroupSocketEventHandlers } from "./useGroupSocket";
import { useRouter } from "next/navigation";

export default function useGroupSession(groupId: string) {
    const [session, setSession] = useState<GroupSession | null>(null);
    const [queue, setQueue] = useState<ScoredTrack[]>([]);
    const [nowPlaying, setNowPlaying] = useState<GroupSession['nowPlaying'] | null>(null);

    const { setAlert } = useAlertContext();
    const errorDuration = 1500;

    const router = useRouter();

    const eventHandlers: GroupSocketEventHandlers = {
        onQueueUpdate: setQueue,
        onSessionUpdate: setSession,
        onNowPlayingUpdate: setNowPlaying,
        onDisconnect: useCallback(() => {
            setAlert('Disconnected from session', 'info', errorDuration);
            router.back();
        }, [router, setAlert]),

        onError: useCallback((error: string) => {
            setAlert(error, 'error', errorDuration);
        }, [router, setAlert]),
    };

    const { actions: socketActions } = useGroupSocket(groupId, eventHandlers);

    const addTrackToQueue = (track: Track) => {
        const leadTrackScore = queue[0]?.score ?? 0;

        const score = queue.length > 0
            ? leadTrackScore
            : leadTrackScore + 1;

        socketActions.queue.add(track, score);
    };

    const syncQueue = useCallback((newQueue: ScoredTrack[]) => {
        setQueue(newQueue);
        socketActions.syncQueue(newQueue);
    }, [socketActions]);

    const syncSession = useCallback((newSession: GroupSession) => {
        setSession(newSession)
        socketActions.syncSession(newSession);
    }, [socketActions]);


    return {
        session, setSession, syncSession,
        queue, setQueue, syncQueue,
        nowPlaying,
        socketActions,
        addTrackToQueue,
    }
}