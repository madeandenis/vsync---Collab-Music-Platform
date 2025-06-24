import { IoPlayForwardSharp } from "react-icons/io5";

type NextButtonProps = {
  isReady: boolean;
  isLoading: boolean;
  iconSize?: number;
  onNext?: () => Promise<void>;
  setIsLoading: (loading: boolean) => void;
};

const NextButton = ({
  isReady,
  isLoading,
  iconSize = 22,
  onNext,
  setIsLoading,
}: NextButtonProps) => {

  const handleClick = async () => {
    if (!onNext) return;

    setIsLoading(true);

    try {
      await onNext();
    } catch (error) {
      console.error("Error skipping to the next track:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      disabled={!isReady || isLoading}
      onClick={handleClick}
      className="p-2 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
      aria-label={isReady ? "Next" : "Next (currently unavailable)"}
    >
      <IoPlayForwardSharp size={iconSize} />
    </button>
  );
};

export default NextButton;
