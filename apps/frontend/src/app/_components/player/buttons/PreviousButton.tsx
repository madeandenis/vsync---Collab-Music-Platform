import { IoPlayBackSharp } from "react-icons/io5";

type PreviousButtonProps = {
  isReady: boolean;
  isLoading: boolean;
  iconSize?: number;
  onPrevious?: () => Promise<void>;
  setIsLoading: (loading: boolean) => void;
};

const PreviousButton = ({
  isReady,
  isLoading,
  iconSize = 22,
  onPrevious,
  setIsLoading,
}: PreviousButtonProps) => {
  const handleClick = async () => {
    if (!onPrevious) return;

    setIsLoading(true);

    try {
      await onPrevious();
    } catch (error) {
      console.error("Error skipping to the previous track:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      disabled={!isReady || isLoading}
      onClick={handleClick}
      className="p-2 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
      aria-label={isReady ? "Previous" : "Previous (currently unavailable)"}
    >
      <IoPlayBackSharp size={iconSize} />
    </button>
  );
};

export default PreviousButton;
