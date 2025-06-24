import { useState, useEffect, useRef } from "react";
import { formatMs } from "../../../_utils/timeUtils";
import Slider from "../../sliders/Slider";

interface PlaybackSeekBarProps {
  isReady: boolean;
  duration?: number;
  playbackPosition?: number;
  onChange?: (value: number) => void;
}

export default function PlaybackSeekBar({ isReady, duration, playbackPosition, onChange }: PlaybackSeekBarProps) {
  const [dragPosition, setDragPosition] = useState<number | undefined>(playbackPosition);
  const isDraggingRef = useRef(false);

  // Sync drag position with playbackPosition when not dragging
  useEffect(() => {
    if (!isDraggingRef.current && isReady) {
      setDragPosition(playbackPosition);
    }
  }, [playbackPosition, isReady]);

  // Start dragging
  const handleDragStart = () => {
    if (!isReady) return;
    isDraggingRef.current = true;
  };

  // Update position while dragging
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isReady) return;
    setDragPosition(parseInt(e.target.value));
  };

  // Stop dragging and notify parent
  const handleSliderRelease = () => {
    if (!isReady) return;
    if (dragPosition !== undefined && onChange) {
      onChange(dragPosition);
    }
    isDraggingRef.current = false;
  };

  const currentTime = isReady 
    ? (dragPosition !== undefined ? formatMs(dragPosition) : '--:--')
    : '--:--';
  
  const totalDuration = isReady 
    ? (duration !== undefined ? formatMs(duration) : '--:--')
    : '--:--';

  return (
    <div className="flex items-center gap-2 text-xs text-white/90 w-full">
      {/* Current time */}
      <span className="w-10 text-right">
        {currentTime}
      </span>

      {/* Playback slider */}
      <Slider
        min={0}
        max={duration ?? 100}
        value={dragPosition ?? 0}
        onChange={handleSliderChange}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onMouseUp={handleSliderRelease}
        onTouchEnd={handleSliderRelease}
        displayThumb={false}
        className="w-full"
        disabled={!isReady}
      />

      {/* Total duration */}
      <span className="w-10 text-left">
        {totalDuration}
      </span>
    </div>
  );
}