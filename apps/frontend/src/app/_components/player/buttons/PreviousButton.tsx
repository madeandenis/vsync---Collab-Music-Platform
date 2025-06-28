import { IoPlayBackSharp } from "react-icons/io5";

interface PreviousButtonProps {
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  onPrevious: () => Promise<void>;
  iconSize: number;
};

const PreviousButton = ({
  isProcessing,
  setIsProcessing,
  onPrevious,
  iconSize,
}: PreviousButtonProps) => {

  const handleClick = async () => {
    if (!onPrevious) return;

    setIsProcessing(true);

    try {
      await onPrevious();
    } catch (error) {
      console.error("Error skipping to the previous track:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      disabled={isProcessing}
      onClick={handleClick}
      className="p-2 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
      aria-label={"Previous track"}
    >
      <IoPlayBackSharp size={iconSize} />
    </button>
  );
};

export default PreviousButton;
