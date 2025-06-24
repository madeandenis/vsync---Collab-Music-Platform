import { useEffect, useRef } from "react";
import { ScoredTrack } from "@frontend/shared";
import { Spotify } from "../_types/spotify";
import { rotateQueueForward } from "../_utils/queueUtils";

/**
 * Watches for playback state changes. If playback stops at the beginning
 * of a track (indicating it has ended), it plays the next track.
 */
const usePlaybackStateMonitor = (
    player: Spotify.Player | null,
    nextTrackId: string | undefined,
    playTrack: (trackId: string) => void
) => {
    const previousStateRef = useRef<Spotify.PlaybackState | null>(null);

    useEffect(() => {
        if (!player || !nextTrackId) return;

        const handleStateChange = (state: Spotify.PlaybackState) => {
            if (!state) return;

            const prevState = previousStateRef.current;
            const wasPlaying = prevState?.paused === false;
            const stoppedAtStart = state.paused && state.position === 0;

            if (wasPlaying && stoppedAtStart && nextTrackId) {
                playTrack(nextTrackId);
            }

            previousStateRef.current = state;
        };

        player.addListener('player_state_changed', handleStateChange);

        return () => {
            player.removeListener('player_state_changed', handleStateChange);
        };
    }, [player, nextTrackId, playTrack]);
};

/**
 * React hook that conditionally rotates the queue when the current track
 * matches the lead track.
 */
const useQueueRotation = (
    queue: ScoredTrack[],
    setQueue: (newQueue: ScoredTrack[]) => void,
    currentTrackId: string | null,
    leadTrackId: string | undefined
) => {
    useEffect(() => {
        if (!queue.length || !currentTrackId || !leadTrackId) return;

        const isLeadTrackPlaying = leadTrackId === currentTrackId;

        if (isLeadTrackPlaying) {
            const rotated = rotateQueueForward(queue);
            setQueue(rotated);
        }
    }, [queue, currentTrackId, leadTrackId, setQueue]);
};

const getCurrentTrackId = (state: Spotify.PlaybackState | null): string | null => {
    return state?.track_window?.current_track?.id ?? null;
};

const getLeadTrackId = (queue: ScoredTrack[]): string | undefined => {
    return queue[0]?.queuedTrack?.trackDetails?.id;
};

export const useQueueManagement = (
    player: Spotify.Player | null,
    state: Spotify.PlaybackState | null,
    queue: ScoredTrack[],
    setQueue: (newQueue: ScoredTrack[]) => void,
    playTrack: (trackId: string) => void,
) => {
    const currentTrackId = getCurrentTrackId(state);
    const leadTrackId = getLeadTrackId(queue);

    useQueueRotation(queue, setQueue, currentTrackId, leadTrackId);
    usePlaybackStateMonitor(player, leadTrackId, playTrack);
};
