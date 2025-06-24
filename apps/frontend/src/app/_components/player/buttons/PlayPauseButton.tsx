import { IoMdPlay, IoMdPause } from "react-icons/io";
import { ImSpinner8 } from "react-icons/im";

type PlayButtonProps = {
  isReady: boolean;
  isPaused: boolean;
  isLoading: boolean;
  onPause?: () => Promise<void>;
  onResume?: () => Promise<void>;
};

const PlayPauseButton = ({
  isReady,
  isPaused,
  isLoading,
  onPause,
  onResume,
}: PlayButtonProps) => {
  const handleClick = async () => {
    if (isPaused && onResume) {
      await onResume();
    } else if (!isPaused && onPause) {
      await onPause();
    }
  };

  const renderLoadingSpinner = () => (
    <div className="absolute flex items-center justify-center pointer-events-none">
      <ImSpinner8 size={60} className="text-white/20 animate-spin" />
    </div>
  );

  const buttonAriaLabel = isPaused ? "Play" : "Pause";

  const buttonIcon = isPaused ? <IoMdPlay size={18} /> : <IoMdPause size={18} />;

  return (
    <div className="relative flex items-center justify-center">
      {/* Show loading spinner when isLoading is true */}
      {isLoading && renderLoadingSpinner()}

      {/* Play/Pause button */}
      <button
        disabled={!isReady || isLoading}
        onClick={handleClick}
        className="flex items-center justify-center p-3 rounded-full bg-white text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label={buttonAriaLabel}
      >
        {buttonIcon}
      </button>
    </div>
  );
};

export default PlayPauseButton;
