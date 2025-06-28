import { IoMdPlay, IoMdPause } from "react-icons/io";
import { HiMiniPlayPause } from "react-icons/hi2";
import { Playback } from "../../../_types/playback.types";

interface PlayButtonProps {
  playbackState: Playback.State | null;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  onStartPlayback: () => Promise<void>;
  onTogglePlay: ( )=> Promise<void>;
  iconSize: number;
};

const PlayPauseButton = ({
  playbackState,
  isProcessing,
  setIsProcessing,
  onStartPlayback,
  onTogglePlay,
  iconSize,
}: PlayButtonProps) => {

  async function handleClick() {
    setIsProcessing(true);

    console.log(playbackState?.track_window);

    try {
      if(!playbackState?.track_window?.current_track){
        await onStartPlayback();
      } else {
        await onTogglePlay();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      disabled={isProcessing}
      onClick={handleClick}
      className="flex items-center justify-center p-3 rounded-full bg-white text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {
        !playbackState?.track_window?.current_track ? (
          <HiMiniPlayPause size={iconSize} />
        ) : playbackState?.paused ? (
          <IoMdPlay size={iconSize} />
        ) : (
          <IoMdPause size={iconSize} />
        )
      }
    </button>
  );
};

export default PlayPauseButton;
