import { IoMdRepeat } from "react-icons/io";

type RepeatButtonProps = {
  isReady: boolean;
  isRepeatOn: boolean;
  onRepeat?: (isRepeatOn: boolean) => void;
};

const RepeatButton = ({ isReady, isRepeatOn, onRepeat }: RepeatButtonProps) => {
  const handleToggleRepeat = () => {
    if (!isReady || !onRepeat) return;
    onRepeat(!isRepeatOn); 
  };
  
  const getButtonStyles = () => {
    let baseClasses = "p-2 rounded-full transition-colors";
    return isRepeatOn 
      ? `${baseClasses} text-green-500 hover:bg-white/10`
      : `${baseClasses} text-white hover:bg-white/10`;
  };

  if (!isReady) return null;

  return (
    <button
      onClick={handleToggleRepeat}
      className={getButtonStyles()}
      aria-label={isRepeatOn ? "Disable repeat" : "Enable repeat"}
    >
      <IoMdRepeat size={20} />
    </button>
  );
};

export default RepeatButton;