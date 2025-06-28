import PlayerController from "./PlayerController";
import TrackInfo from "../TrackInfo";
import PlaybackError from "./PlaybackError";
import { GroupSession, Track } from "@frontend/shared";
import LoadingPlayer from "./sliders/LoadingPlayer";
import { PlaybackContext } from "../../_hooks/usePlayback";
import { useMediaQuery } from "react-responsive";
import { useMemo } from "react";
import { useImageGradient } from "../../_utils/colorUtils";

interface PlayerProps {
    playback: PlaybackContext;
    nowPlaying: GroupSession['nowPlaying'] | null,    
}

export default function Player({
    nowPlaying,
    playback
}: PlayerProps) {

    const { player, error } = playback['states'];
    const { setError } = playback['setters'];
    
    const isSmallScreen = useMediaQuery({ minWidth: 500 });
    const albumImageUrl = useMemo(
        () => nowPlaying?.track?.album?.images?.[0]?.url ?? '',
        [nowPlaying?.track]
    ); 
    const gradientAngle = useMemo(
        () => (isSmallScreen ? 90 : 180),
        [isSmallScreen]
    );
    const bgGradient = useImageGradient(albumImageUrl, gradientAngle);

    const flexDirectionClass = error ? 'flex-col' : 'flex-col md:flex-row';

    return (
        <div
            className={`flex items-center justify-center p-4 rounded-lg font-nunito gap-6 ${flexDirectionClass}`}
            style={{ background: bgGradient }}
        >
            {nowPlaying?.track && (
                <div className="w-full md:w-1/2">
                    <TrackInfo track={nowPlaying?.track} albumImageUrl={albumImageUrl} />
                </div>
            )}

            {error && <PlaybackError error={error} onRefresh={() => setError(null)} />}

            {player && !error && (
                <PlayerController
                    playback={playback}
                />
            )}

            {!player && !error && <LoadingPlayer />}
        </div>
    );
}