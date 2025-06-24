import { Spotify } from "../../_types/spotify";
import { useEffect, useRef, useState } from "react";
import PlaybackSeekBar from "./sliders/PlaybackSeekBar";
import RepeatButton from "./buttons/RepeatButton";
import PreviousButton from "./buttons/PreviousButton";
import PlayPauseButton from "./buttons/PlayPauseButton";
import NextButton from "./buttons/NextButton";
import VolumeControl from "./sliders/VolumeControl";
import { useVolumeControl } from "../../_hooks/useVolumeControl";

type SpotifyPlayerControlsProps = {
  isReady: boolean;
  isPaused: boolean;
  isRepeatOn: boolean;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  getCurrentState?: () => Promise<Spotify.PlaybackState | null>;
  getVolume?: () => Promise<number>;
  onPause?: () => Promise<void>;
  onResume?: () => Promise<void>;
  onPrevious?: () => Promise<void>;
  onNext?: () => Promise<void>;
  onSeek?: (position_ms: number) => Promise<void>;
  onSetVolume?: (volume: number) => Promise<void>;
  onRepeat?: (isRepeatOn: boolean) => void;
};

const SpotifyPlayerControls = ({
  isReady,
  isPaused,
  isRepeatOn,
  isLoading,
  setIsLoading,
  getCurrentState,
  getVolume,
  onPrevious,
  onPause,
  onResume,
  onNext,
  onSeek,
  onSetVolume,
  onRepeat,
}: SpotifyPlayerControlsProps) => {
  const [playbackState, setPlaybackState] = useState<Spotify.PlaybackState | undefined>(undefined);
  const { volume, setVolume }= useVolumeControl();
  const refreshStateInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  // Polls playback state while the user is playing
  useEffect(() => {
    if (!getCurrentState || isPaused) {
      // Stops polling when playback is paused.
      if (refreshStateInterval.current) {
        clearInterval(refreshStateInterval.current);
        refreshStateInterval.current = undefined;
      }
      return;
    }

    // Poll playback state every second
    refreshStateInterval.current = setInterval(async () => {
      const state = await getCurrentState();
      if (state) {
        setPlaybackState(state);
      }
    }, 1000);

    // Cleanup on unmount or when paused
    return () => {
      if (refreshStateInterval.current) {
        clearInterval(refreshStateInterval.current);
        refreshStateInterval.current = undefined;
      }
    };
  }, [isPaused, getCurrentState]);

  // Initialize volume on component mount
  useEffect(() => {
    const initVolume = async () => {
      if (getVolume && isReady) {
        const currentVolume = await getVolume();
        setVolume(currentVolume);
      }
    };
    initVolume();
  }, [getVolume, isReady]);

  // Updates volume when the user changes it.
  const handleVolumeChange = async (volume: number) => {
    if (onSetVolume && isReady) {
      await onSetVolume(volume / 100);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-row items-center gap-2 text-white">

        <RepeatButton
          isReady={isReady}
          isRepeatOn={isRepeatOn}
          onRepeat={onRepeat}
        />

        <PreviousButton
          isReady={isReady}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          onPrevious={onPrevious}
        />

        <PlayPauseButton
          isReady={isReady}
          isPaused={isPaused}
          isLoading={isLoading}
          onPause={onPause}
          onResume={onResume}
        />

        <NextButton
          isReady={isReady}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          onNext={onNext}
        />

        <VolumeControl
          isReady={isReady}
          volume={volume * 100}
          onChange={handleVolumeChange}
        />
      </div>

      <PlaybackSeekBar
        isReady={isReady}
        duration={playbackState?.duration}
        playbackPosition={playbackState?.position}
        onChange={onSeek}
      />
    </div>
  );
};

export default SpotifyPlayerControls;
