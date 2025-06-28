import { useCallback, useState } from "react";
import RepeatButton from "./buttons/RepeatButton";
import PreviousButton from "./buttons/PreviousButton";
import NextButton from "./buttons/NextButton";
import PlayPauseButton from "./buttons/PlayPauseButton";
import VolumeControl from "./sliders/VolumeControl";
import PlaybackSeekBar from "./sliders/PlaybackSeekBar";
import { usePolling } from "../../_hooks/usePooling";
import { useVolumePersistence } from "../../_hooks/useVolumePersistence";
import { PlaybackContext } from "../../_hooks/usePlayback";
import { GroupSession } from "@frontend/shared";

interface PlayerControllerProps {
    playback: PlaybackContext;
}

export default function PlayerController({
    playback,
}: PlayerControllerProps) {

    const { player, state, repeatMode } = playback['states'];
    const { setState, setError } = playback['setters'];

    if (!player) return null;

    const [isProcessing, setIsProcessing] = useState(false);
    const { volume, setVolume } = useVolumePersistence();

    const syncVolume = useCallback((volume: number) => {
        try {
            player.setVolume(volume); // sync on remote 
            setVolume(volume);        // persist locally
        } catch (error) {
            console.error('Failed to sync volume:', error);
        }
    }, []);

    usePolling(
        () => player.getCurrentState(),
        setState,
        {
            interval: 1000,
            enabled: !state?.paused,
        }
    );

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex flex-row items-center gap-2">
                <RepeatButton
                    repeatMode={repeatMode}
                    setRepeatMode={player.setRepeatMode}
                    iconSize={20}
                />

                <PreviousButton
                    isProcessing={isProcessing}
                    setIsProcessing={setIsProcessing}
                    onPrevious={player.previousTrack}
                    iconSize={22}
                />

                <PlayPauseButton
                    playbackState={state}
                    isProcessing={isProcessing}
                    setIsProcessing={setIsProcessing}
                    onStartPlayback={player.play}
                    onTogglePlay={player.togglePlay}
                    iconSize={18}
                />

                <NextButton
                    isProcessing={isProcessing}
                    setIsProcessing={setIsProcessing}
                    onNext={player.nextTrack}
                    iconSize={22}
                />

                <VolumeControl
                    volume={volume}
                    onSetVolume={syncVolume}
                    iconSize={18}
                />
            </div>

            <PlaybackSeekBar
                duration={state?.duration}
                playbackPosition={state?.position}
                onSeek={player.seek}
            />
        </div>
    )
}