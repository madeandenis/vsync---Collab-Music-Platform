import TrackInfo from "../TrackInfo";
import PlaybackError from "./PlaybackError";
import { useMediaQuery } from "react-responsive";
import { useMemo, useState } from "react";
import { useImageGradient } from "../../_utils/colorUtils";
import SpotifyPlayerControls from "./SpotifyPlayerControls";
import { PlaybackControls, PlayerState } from "../../_hooks/useSpotifyPlayback";
import { GroupSession, Track } from "@frontend/shared";

interface SpotifyPlayerProps {
  isQueueEmpty: boolean;
  nowPlaying: GroupSession['nowPlaying'];
  playerState: PlayerState;
  playbackControls: PlaybackControls;
}

export default function SpotifyPlayer({
  isQueueEmpty,
  nowPlaying,
  playerState,
  playbackControls
}: SpotifyPlayerProps) {
  const { player, state, isPlayerReady, isRepeatOn, error: playbackError } = playerState;
  const { play, playNext, playPrevious, pausePlayback, resumePlayback, seek, setRepeatMode } = playbackControls;

  const handleSetVolume = player?.setVolume?.bind(player);
  const getCurrentState = player?.getCurrentState?.bind(player);
  const getVolume = player?.getVolume?.bind(player);

  const isSmallScreen = useMediaQuery({ minWidth: 500 });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const currentTrack = state?.track_window.current_track || nowPlaying?.track;
  const albumImageUrl = currentTrack?.album?.images?.[0]?.url ?? '';

  const gradientAngle = useMemo(() => (isSmallScreen ? 90 : 180), [isSmallScreen]);
  const bgGradient = useImageGradient(albumImageUrl, gradientAngle);

  const isControlEnabled = () => {
    return isPlayerReady && !isQueueEmpty;
  };

  return (
    <div
      className="flex flex-col md:flex-row items-center justify-center p-4 rounded-lg font-nunito gap-6"
      style={{ background: bgGradient }}
    >
      {currentTrack &&
        <div className="w-full md:w-1/2">
          <TrackInfo track={currentTrack} albumImageUrl={albumImageUrl} />
        </div>
      }

      {playbackError && <PlaybackError message={playbackError} />}

      <SpotifyPlayerControls
        isReady={isControlEnabled()}
        isPaused={state?.paused ?? true}
        isRepeatOn={isRepeatOn}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        getCurrentState={getCurrentState}
        getVolume={getVolume}
        onPause={pausePlayback}
        onResume={resumePlayback}
        onNext={playNext}
        onPrevious={playPrevious}
        onSeek={seek}
        onSetVolume={handleSetVolume}
        onRepeat={setRepeatMode}
      />
    </div>
  );
}
