import { useQuery } from "@tanstack/react-query";
import { fetchAccessToken } from "../../_api/spotifyApi";
import { ScoredTrack, Track } from "@frontend/shared";
import { useEffect, useState } from "react";
import { useSpotifyPlayback } from "../../_hooks/useSpotifyPlayback";
import TrackInfo from "../TrackInfo";
import PlaybackControls from "./PlaybackControl";
import PlaybackError from "./PlaybackError";

interface SpotifyPlayerProps {
    queue: ScoredTrack[] | null;
    playingTrackIndex?: number;
}

export default function SpotifyPlayer({queue, playingTrackIndex = 0}: SpotifyPlayerProps) {
    const [playingTrack, setPlayingTrack] = useState<Track | null>(null);
    const [containerWidth, setContainerWidth] = useState<{left: number, right: number}>({ left: 0, right: 100 });
    
    const { data: accessToken } = useQuery({
        queryKey: ['accessToken'],
        queryFn: fetchAccessToken
    })
    
    const { player, deviceId, isReady: isPlaybackReady, error: playbackError, currentState } = useSpotifyPlayback(accessToken); 
    
    // Available Queue -> Playing Track 
    useEffect(() => {
        if(queue && queue.length > 0)
        {
            setPlayingTrack(queue[playingTrackIndex].queuedTrack.trackDetails);
        }
        else
        {
            setPlayingTrack(null);
        }
    }, [queue, playingTrackIndex])

    // Ready Playback hook && Playing Track -> Display Left component -> Display Track Info or Playback Error
    useEffect(() => {
        if(playbackError || (isPlaybackReady && playingTrack))
        {
            setContainerWidth({ left: 60, right: 40 });
        }
        else
        {
            setContainerWidth({ left: 0, right: 100 });
        }
    }, [isPlaybackReady, playingTrack, playbackError])

    return (
        <div className="flex justify-between py-4 px-6 bg-white/5 rounded-lg font-nunito">
            {/* Left Container */}
            <div
                style={{ width: `${containerWidth.left}%` }}
            >
                {
                    playbackError ?
                    <PlaybackError message={playbackError}/> 
                    :
                    (playingTrack && <TrackInfo track={playingTrack} imageSize={80}/>)
                }
            </div>

            {/* Right Container */}
            <div
                className="flex flex-col justify-center items-center gap-4"
                style={{ width: `${containerWidth.right}%` }}
            >
                <PlaybackControls />
            </div>
        </div>
    )
}