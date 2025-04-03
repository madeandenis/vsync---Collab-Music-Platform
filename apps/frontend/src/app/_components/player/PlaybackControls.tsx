import { IoMdPlay, IoMdPause } from "react-icons/io";
import { IoPlayBackSharp, IoPlayForwardSharp } from "react-icons/io5";
import { ImSpinner8 } from "react-icons/im";

type PlaybackControlsProps = {
  ready: boolean;
  paused: boolean;
  loading: boolean;
  onTogglePlay?: () => Promise<void>;
  onNext?: () => Promise<void>;
  onPrevious?: () => Promise<void>;
};

const PlaybackControls = ({ ready, paused, loading, onPrevious, onTogglePlay, onNext }: PlaybackControlsProps) => {
  const backgroundStyle = { background: ready ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)' };
  const colorStyle = { color: ready ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)' };

  return (
    <div
      className="flex flex-row items-center gap-4" style={colorStyle}>

      <button disabled={!ready} onClick={onPrevious} className="p-2">
        <IoPlayBackSharp size={22} className="cursor-pointer" />
      </button>

      <div className="relative flex items-center justify-center">
        {loading && (
            <div className="absolute flex items-center justify-center">
              <ImSpinner8 size={60} className="text-white/20 animate-spin" />
            </div>
        )}
        <button
          disabled={!ready}
          onClick={onTogglePlay}
          className="flex items-center p-3 rounded-full cursor-pointer"
          style={backgroundStyle}
        >
          {paused ? <IoMdPlay size={18} className="text-black" /> : <IoMdPause size={18} className="text-black" />}
        </button>
      </div>

      <button disabled={!ready} onClick={onNext} className="p-2">
        <IoPlayForwardSharp size={22} className="cursor-pointer" />
      </button>

    </div>
  );
};

export default PlaybackControls;
