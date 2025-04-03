import { ScoredTrack, Track } from "@frontend/shared";
import { SpotifyPlaybackHook } from "./useSpotifyPlayback";
import { useEffect, useRef } from "react";
import { Spotify } from "../_types/spotify";

const getTrackPosition = async (player: Spotify.Player | null): Promise<number> => {
    if (!player) return 0;
    try {
        const state = await player.getCurrentState();
        return state?.position ?? 0;
    } catch (error) {
        return 0;
    }
};

const leadTrack = (queue: ScoredTrack[]): Track => 
    queue[0]?.queuedTrack.trackDetails;

const currentTrack = (playback: SpotifyPlaybackHook): Spotify.WebPlaybackTrack | undefined=>
    playback.state?.track_window.current_track;

const isPlayingTrack = (playback: SpotifyPlaybackHook): boolean =>
    !!currentTrack(playback); 

const usePlaybackDependencies = (playback: SpotifyPlaybackHook) => 
    [
        playback.isPlayerReady,
        playback.deviceId,
        playback.state,
        playback.player
    ]

const useQueueManager = (
    queue: ScoredTrack[],
    setQueue: (updatedQueue: ScoredTrack[]) => void,
    playback: SpotifyPlaybackHook) =>
{
    const prevQueueLength = useRef<number>(queue.length);    

    // Upload the queue when playback has no tracks
    useEffect(() => {
        if(!queue.length || isPlayingTrack(playback)) return;

        playback.playQueue(queue); // has an if guard on the method

    }, [queue, ...usePlaybackDependencies(playback)])

    // Check if the lead track from the queue matches the currently playing track
    useEffect(() => {
        if(!queue.length) return;

        const current = currentTrack(playback);
        if (!current) return;

        // If they match, rotate the queue
        if(leadTrack(queue).id === current.id)
        {
            const rotatedQueue = [...queue.slice(1), { ...queue[0], score: 0}]; // Overwrite the score with 0
            setQueue(rotatedQueue);
        }

    }, [playback.state]) 

    // Monitor if the queue length changes and update playback queue accordingly
    useEffect(() => {
        (async () => {
            if(!queue.length) return;
            
            const current = currentTrack(playback);
            if (!current) return;
    
            const currQueueLength = queue.length;
            if(currQueueLength != prevQueueLength.current) {
                const offset = queue.findIndex((track) => track.queuedTrack.trackDetails.id === current.id);
                const position_ms = await getTrackPosition(playback.player);
                
                playback.playQueue(queue, offset, position_ms);
                
                prevQueueLength.current = currQueueLength;
            }
        })(); // Immediately Invoked Function Expression
    }, [queue])
};

export default useQueueManager;