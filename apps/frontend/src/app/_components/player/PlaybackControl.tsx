import { FaBackwardStep, FaPause, FaForwardStep } from "react-icons/fa6";

type PlaybackControlsProps = {
  onPrevious?: () => void;
  onPause?: () => void;
  onNext?: () => void;
};

const PlaybackControls: React.FC<PlaybackControlsProps> = ({ onPrevious, onPause, onNext }) => {
  return (
    <div className="flex flex-row items-center gap-4 text-white">
      <FaBackwardStep size={24} className="cursor-pointer" onClick={onPrevious} />
      <div className="bg-white/90 p-2 rounded-full cursor-pointer" onClick={onPause}>
        <FaPause size={16} className="text-black" />
      </div>
      <FaForwardStep size={24} className="cursor-pointer" onClick={onNext} />
    </div>
  );
};

export default PlaybackControls;
