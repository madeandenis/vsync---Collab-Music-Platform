import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { PlaybackRequest, startPlaybackOnDevice } from "../../_api/spotifyApi";
import { GroupSocketActions } from "../group/useGroupSocket";
import { GroupSession, ScoredTrack } from "@frontend/shared";
import { PlaybackContext } from "../usePlayback";

export function useSpotifyPlayerActions(
    context: PlaybackContext,
    nowPlaying: GroupSession['nowPlaying'] | undefined,
    queue: ScoredTrack[],
    playbackEmitters: GroupSocketActions['playback'],
    accessToken?: string
) {
    const { sdkPlayer: player, deviceId, state: playbackState, repeatMode } = context['states'];
    
    // Store refs to avoid recreating callbacks when these change frequently
    const nowPlayingRef = useRef(nowPlaying);
    const playerRef = useRef(player);
    const deviceIdRef = useRef(deviceId);
    const accessTokenRef = useRef(accessToken);
    const queueRef = useRef(queue);
    
    // Update refs on each render
    nowPlayingRef.current = nowPlaying;
    playerRef.current = player;
    deviceIdRef.current = deviceId;
    accessTokenRef.current = accessToken;
    queueRef.current = queue;

    const playbackMutation = useMutation({
        mutationFn: (request: PlaybackRequest) => startPlaybackOnDevice(request),
        onError: (error: Error) => console.error('Playback error:', error),
    });

    async function handlePlaybackRequest (trackId: string, positionMs = 0) {
        try {
            if (!playerRef.current || !deviceIdRef.current) {
                throw new Error('Spotify player is not ready');
            }

            if (!accessTokenRef.current) {
                console.warn("Access token is not available.");
                return;
            }

            await playbackMutation.mutateAsync({
                accessToken: accessTokenRef.current,
                deviceId: deviceIdRef.current,
                playback: {
                    uris: [`spotify:track:${trackId}`],
                    position_ms: positionMs
                }
            });
        } catch (error) {
            console.error(error);
        }
    };

    const play = useCallback(async (trackId?: string, positionMs = 0, syncMode = false): Promise<void> => {
        try {
            trackId = trackId ??
                (
                    nowPlayingRef.current?.track.id || 
                    queueRef.current[0]?.queuedTrack?.trackDetails?.id
                );

            if (!trackId) {
                throw new Error("No valid track to play");
            }

            await handlePlaybackRequest(trackId, positionMs);

            if(syncMode) return;

            playbackEmitters.play(trackId);

        } catch (error) {
            console.error("Error playing track:", error);
        }
    }, [playbackEmitters]);

    const nextTrack = useCallback(async (syncMode = false): Promise<void> => {
        try {
            const nextTrackId = queueRef.current[0]?.queuedTrack?.trackDetails?.id;

            if (!nextTrackId) {
                throw new Error("No valid track to play next");
            }

            if(repeatMode == 'on') {
                await seek(0);
                await resume();
                return;
            }

            await handlePlaybackRequest(nextTrackId);

            if(syncMode) return;

            playbackEmitters.nextTrack(nextTrackId);

        } catch (error) {
            console.error("Error playing next track:", error);
        }
    }, [repeatMode, playbackEmitters]);

    const previousTrack = useCallback(async (syncMode = false): Promise<void> => {
        try {
            // TODO: Implement - play previous from the session track history

            if(syncMode) return;

        } catch (error) {
            console.error("Error playing previous track:", error);
        }
    }, []);

    // Pass playbackState as parameter to avoid dependency
    const pause = useCallback(async (syncMode = false): Promise<void> => {
        try {
            if (!playerRef.current || !deviceIdRef.current) {
                throw new Error('Spotify player is not ready');
            }

            const currentTrack = playbackState?.track_window?.current_track;

            if (!currentTrack) {
                throw new Error("No track currently playing to pause.");
            }

            await playerRef.current.pause();

            if(syncMode) return;

            playbackEmitters.pause(currentTrack.id, playbackState.position);

        } catch (error) {
            console.error("Error pausing playback:", error);
        }
    }, [playbackEmitters]);

    const resume = useCallback(async (syncMode = false): Promise<void> => {
        try {            
            if (!playerRef.current || !deviceIdRef.current) {
                throw new Error('Spotify player is not ready');
            }

            const currentTrack = playbackState?.track_window?.current_track;

            if (!currentTrack) {
                throw new Error("No track currently playing to resume.");
            }

            await playerRef.current.resume();

            if(syncMode) return;

            playbackEmitters.resume(currentTrack.id, playbackState.position);

        } catch (error) {
            console.error("Error resuming playback:", error);
        }
    }, [playbackEmitters]);

    const togglePlay = useCallback(async (syncMode = false): Promise<void> => {
        try {
            if (!playbackState?.paused) {
                await pause(syncMode);
            } else {
                await resume(syncMode);
            }
        } catch (error) {
            console.error("Error toggling play:", error);
        }
    }, [pause, resume]);

    const seek = useCallback(async (positionMs: number, syncMode = false): Promise<void> => {
        try {            
            if (!playerRef.current || !deviceIdRef.current) {
                throw new Error('Spotify player is not ready');
            }

            const currentTrack = playbackState?.track_window?.current_track;

            if (!currentTrack) {
                throw new Error("No track currently playing to seek.");
            }

            await playerRef.current.seek(positionMs);

            if(syncMode) return;

            playbackEmitters.seek(currentTrack.id, positionMs);

        } catch (error) {
            console.error("Error seeking:", error);
        }
    }, [playbackEmitters]);

    return { play, nextTrack, previousTrack, pause, resume, togglePlay, seek };
}