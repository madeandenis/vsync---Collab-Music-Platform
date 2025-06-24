import { useMutation } from "@tanstack/react-query";
import { PlaybackRequest, startPlaybackOnDevice } from "../_api/spotifyApi";
import { Spotify } from "../_types/spotify";
import { useCallback } from "react";
import { ScoredTrack } from "@frontend/shared";

export interface PlaybackEventEmitters {
    emitPauseTrack: (trackId: string, progressMs: number) => void;
    emitResumeTrack: (trackId: string, progressMs: number) => void;
    emitPlayTrack: (trackId: string) => void;
    emitNextTrack: (trackId: string) => void;
    emitPreviousTrack: (trackId: string) => void;
    emitSeekTrack: (trackId: string, seekPosition: number) => void;
}

export function usePlaybackControls(
    player: Spotify.Player | null,
    isPlayerReady: boolean,
    deviceId: string | null,
    accessToken: string | undefined,
    emitters: PlaybackEventEmitters,
    state: Spotify.PlaybackState | null,
    queue: ScoredTrack[]
) {

    const playbackMutation = useMutation({
        mutationFn: (request: PlaybackRequest) => startPlaybackOnDevice(request),
        onError: (error: Error) => console.error('Playback error:', error),
    });

    /**
     * Validates that the Spotify player is ready for playback
     * @throws Error if player is not ready
     */
    const validatePlayerReady = useCallback(() => {
        if (!player || !isPlayerReady) {
            throw new Error('Spotify player is not ready');
        }
        return player;
    }, [player, isPlayerReady]);

    /**
     * Validates that the playback queue is not empty
     * @throws Error if queue is empty
     */
    const validateQueue = useCallback(() => {
        if (!queue.length) throw new Error("Playback queue is empty");
        return queue;
    }, [queue]);

    const getLeadTrack = useCallback(() => {
        validateQueue();
        return queue[0];
    }, [queue, validateQueue]);

    const getTailTrack = useCallback(() => {
        validateQueue();
        return queue[queue.length - 1];
    }, [queue, validateQueue]);

    /**
     * Handles the actual playback request to Spotify API
     */
    const handlePlaybackRequest = useCallback(async (trackId: string, positionMs = 0) => {
        if (!accessToken || !isPlayerReady || !deviceId) return;

        await playbackMutation.mutateAsync({
            accessToken,
            deviceId,
            playback: {
                uris: [`spotify:track:${trackId}`],
                position_ms: positionMs
            }
        });
    }, [accessToken, isPlayerReady, deviceId, playbackMutation]);

    /**
     * Plays a specific track or the lead track if no ID provided
     */
    const play = useCallback(async (trackId?: string, positionMs = 0): Promise<void> => {
        try {
            validatePlayerReady();

            const trackToPlay = trackId
                ? trackId
                : getLeadTrack().queuedTrack.trackDetails?.id;

            if (!trackToPlay) {
                throw new Error("No valid track to play");
            }

            await handlePlaybackRequest(trackToPlay, positionMs);
            emitters.emitPlayTrack(trackToPlay);
        } catch (error) {
            console.error("Error playing track:", error);
        }
    }, [validatePlayerReady, getLeadTrack, handlePlaybackRequest, emitters]);

    /**
     * Plays the next track in the queue
     */
    const playNext = useCallback(async (): Promise<void> => {
        try {
            validatePlayerReady();
            validateQueue();

            const nextTrackId = getLeadTrack().queuedTrack.trackDetails.id;

            if (!nextTrackId) return;

            await handlePlaybackRequest(nextTrackId);
            emitters.emitNextTrack(nextTrackId);
        } catch (error) {
            console.error("Error playing next track:", error);
        }
    }, [validatePlayerReady, getLeadTrack, handlePlaybackRequest, emitters]);

    /**
      * Plays the previous track in the queue
      */
    const playPrevious = useCallback(async (): Promise<void> => {
        try {
            validatePlayerReady();
            validateQueue();

            // TODO -> play previous from the session track history
            const prevTrackId = getTailTrack().queuedTrack.trackDetails.id;

            if (!prevTrackId) return;

            await handlePlaybackRequest(prevTrackId);
            emitters.emitPreviousTrack(prevTrackId);
        } catch (error) {
            console.error("Error playing previous track:", error);
        }
    }, [validatePlayerReady, getTailTrack, handlePlaybackRequest, emitters]);


    /**
     * Pauses the current playback
     */
    const pausePlayback = useCallback(async (): Promise<void> => {
        try {
            const currentTrack = state?.track_window.current_track;

            if (!currentTrack) {
                console.warn("No track currently playing to pause.");
            }

            const playerInstance = validatePlayerReady();
            await playerInstance.pause();

            const position = state?.position || 0;

            if (currentTrack?.id) {
                emitters.emitPauseTrack(currentTrack.id, position);
            }
        } catch (error) {
            console.error("Error pausing playback:", error);
        }
    }, [validatePlayerReady, state, emitters]);


    /**
     * Resumes the current playback
     */
    const resumePlayback = useCallback(async (): Promise<void> => {
        try {
            const currentTrack = state?.track_window.current_track;

            if (!currentTrack) {
                console.warn("No track currently playing to resume.");
            }

            const playerInstance = validatePlayerReady();
            await playerInstance.resume();

            const position = state?.position || 0;

            if (currentTrack?.id) {
                emitters.emitResumeTrack(currentTrack.id, position);
            }
        } catch (error) {
            console.error("Error resuming playback:", error);
        }
    }, [validatePlayerReady, state, emitters]);

    /**
     * Seeks to a specific position in the current track
     */
    const seek = useCallback(async (positionMs: number): Promise<void> => {
        try {
            const currentTrack = state?.track_window.current_track;

            if (!currentTrack) {
                console.warn("No track currently playing to seek.");
            }
            
            const playerInstance = validatePlayerReady();
            await playerInstance.seek(positionMs);

            if (currentTrack?.id) {
                emitters.emitSeekTrack(currentTrack.id, positionMs);
            }
        } catch (error) {
            console.error("Error seeking to position:", error);
        }
    }, [validatePlayerReady, state, emitters]);

    return {
        play,
        playNext,
        playPrevious,
        pausePlayback,
        resumePlayback,
        seek
    };
}