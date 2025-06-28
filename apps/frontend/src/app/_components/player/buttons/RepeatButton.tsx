import { IoMdRepeat } from "react-icons/io";

interface RepeatButtonProps {
  repeatMode?: 'off' | 'on';
  setRepeatMode: (repeatMode: 'off' | 'on') => void;
  iconSize: number; 
};

const RepeatButton = ({
  repeatMode = 'off',
  setRepeatMode,
  iconSize
}: RepeatButtonProps) => {
  
  const handleToggleRepeat = () => {
    const nextMode = repeatMode === 'off' ? 'on' : 'off';
    setRepeatMode(nextMode);
  };
  
  const getButtonStyles = () => {
    let baseClasses = "p-2 rounded-full transition-colors";
    
    return repeatMode == 'on' 
      ? `${baseClasses} text-green-500 hover:bg-white/10`
      : `${baseClasses} text-white hover:bg-white/10`;
  };

  return (
    <button
      onClick={handleToggleRepeat}
      className={getButtonStyles()}
      aria-label={repeatMode == 'on' ? "Disable repeat" : "Enable repeat"}
    >
      <IoMdRepeat size={iconSize} />
    </button>
  );
};

export default RepeatButton;