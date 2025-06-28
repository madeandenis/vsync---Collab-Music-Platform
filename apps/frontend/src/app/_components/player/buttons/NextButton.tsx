import { IoPlayForwardSharp } from "react-icons/io5";

interface NextButtonProps {
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  onNext?: () => Promise<void>;
  iconSize: number;
};

const NextButton = ({
  isProcessing,
  setIsProcessing,
  onNext,
  iconSize,
}: NextButtonProps) => {

  const handleClick = async () => {
    if (!onNext) return;

    setIsProcessing(true);

    try {
      await onNext();
    } catch (error) {
      console.error("Error skipping to the next track:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      disabled={isProcessing}
      onClick={handleClick}
      className="p-2 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
      aria-label={"Next track"}
    >
      <IoPlayForwardSharp size={iconSize} />
    </button>
  );
};

export default NextButton;
