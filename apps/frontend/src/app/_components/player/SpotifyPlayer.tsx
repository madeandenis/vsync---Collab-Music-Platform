import { ScoredTrack } from "@frontend/shared";
import { SpotifyPlaybackHook } from "../../_hooks/useSpotifyPlayback";
import TrackInfo from "../TrackInfo";
import PlaybackControls from "./PlaybackControls";
import PlaybackError from "./PlaybackError";
import { useColor } from 'color-thief-react'
import { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";

const pausedState = (playback: SpotifyPlaybackHook): boolean => {
    return playback.state?.paused ?? true;
}

const isPlaybackAvailable = (playback: SpotifyPlaybackHook): boolean => {
    const { isPlayerReady, player, state } = playback;
    return Boolean(isPlayerReady && player && state?.track_window?.current_track);
};

const rgbToRgba = (rgbArray: number[], opacity = 0.2) => {
    if (!rgbArray || rgbArray.length !== 3) return `rgba(0,0,0,${opacity})`;
    const [r, g, b] = rgbArray;
    return `rgba(${r},${g},${b},${opacity})`;
};

interface SpotifyPlayerProps {
    queue: ScoredTrack[],
    playback: SpotifyPlaybackHook,
} 

export default function SpotifyPlayer({queue, playback}: SpotifyPlayerProps) {
    const currentTrack = playback.state?.track_window.current_track;
    const albumImageUrl = currentTrack?.album?.images?.[0]?.url || "";
    const isMediumScreen = useMediaQuery({ minWidth: 768 });

    const [bgGradient, setBgGradient] = useState("rgba(255,255,255,0.05)");

    const { data: predominantColor } = useColor(albumImageUrl ?? '', 'rgbArray', {
        crossOrigin: "anonymous",
    });


    const gradientAngle = isMediumScreen ? 90 : 180;
    useEffect(() => {
        if(predominantColor)
        {
            setBgGradient(`
                linear-gradient(${gradientAngle}deg, 
                ${rgbToRgba(predominantColor, 0.8)} 0%, 
                ${rgbToRgba(predominantColor, 0.6)} 20%, 
                ${rgbToRgba(predominantColor, 0.5)} 40%, 
                ${rgbToRgba(predominantColor, 0.3)} 60%, 
                ${rgbToRgba(predominantColor, 0.1)} 80%, 
                black 100%)`);
        }
    }, [predominantColor])

    // Handle the case where the auth token is expired
    // TODO - test for 1 item in the list or 2
    
    const handleNext = async () => {
        const { state, player, isPlayerReady } = playback;
        if (!state || !player || !isPlayerReady || !queue.length) return;

        try {
            const nextTrack = state.track_window.next_tracks[0];
            const leadTrack = queue[0].queuedTrack.trackDetails;

            // No upcoming tracks in Spotify's queue - just skip to next
            if(!nextTrack)
            {
                return await player.nextTrack();
            }

            // Queue mismatch detected - sync the queue with the playback
            if(nextTrack.id !== leadTrack.id)
            {
                playback.playQueue(queue)
            }
            // Queue is in sync - proceed normally
            else
            {
                await player.nextTrack();
            }

        } catch (error) {
            console.error("Error skipping to next track:", error);
        }
    };
    
    const handlePrevious = async () => {
        const { state, player, isPlayerReady } = playback;
        if (!state || !player || !isPlayerReady || !queue.length) return;
        
        try {

            await player.previousTrack();
        } catch (error) {
            console.error("Error going to previous track:", error);
        }
    };
    
    const handleTogglePlay = async () => {
        if (!playback.player || !playback.isPlayerReady) return;
        
        try {
            await playback.player.togglePlay();
        } catch (error) {
            console.error("Error toggling play/pause:", error);
        }
    };

    return (
        <div 
            className="flex flex-col gap-y-6 md:flex-row items-center p-4 rounded-lg font-nunito"
            style={{background: bgGradient}}
        >
            
            {playback.error ? (
                <PlaybackError message={playback.error} />
            ) : (
                currentTrack && <TrackInfo track={currentTrack} size="medium" />
            )}

            <div className="flex flex-col flex-grow justify-center items-center gap-4">
                <PlaybackControls
                    ready={isPlaybackAvailable(playback)}
                    paused={pausedState(playback)}
                    loading={!currentTrack && !playback.error && !!queue.length}
                    onTogglePlay={handleTogglePlay}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                />
            </div>
        </div>
    );
}
