import { useState, useEffect, useRef } from "react";
import { FaVolumeMute, FaVolumeOff, FaVolumeDown, FaVolumeUp, FaCaretUp } from 'react-icons/fa';
import Slider from "../../sliders/Slider";
import { useClickOutside } from "../../../_utils/domUtils";

interface VolumeIconProps {
  currentVolume: number; // 0 to 1
  iconSize: number;
}

interface VolumeControlProps {
  volume?: number; // 0–1
  onSetVolume?: (value: number) => void;
  iconSize: number;
}

const VolumeIcon = ({ currentVolume, iconSize }: VolumeIconProps) => {
  if (currentVolume === 0) return <FaVolumeMute size={iconSize} />;
  if (currentVolume < 0.15) return <FaVolumeOff size={iconSize} />;
  if (currentVolume < 0.65) return <FaVolumeDown size={iconSize} />;
  if (currentVolume <= 1) return <FaVolumeUp size={iconSize} />;
  return <FaVolumeDown size={iconSize} />;
};

export default function VolumeControl({ volume = 0.5, iconSize, onSetVolume }: VolumeControlProps) {
  const [currentVolume, setCurrentVolume] = useState<number>(volume);
  const [previousVolume, setPreviousVolume] = useState<number>(volume);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  
  const isDraggingRef = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync with external volume unless dragging
  useEffect(() => {
    if (!isDraggingRef.current) {
      setCurrentVolume(volume); 
    }
  }, [volume]);

  // Close dropdown on outside click
  useClickOutside(dropdownRef, () => setDropdownOpen(false));

  // Start dragging
  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  // Update volume on drag
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setCurrentVolume(newVolume);
    if (onSetVolume) {
      onSetVolume(newVolume);
    }
  };

  // Stop dragging
  const handleSliderRelease = () => {
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  // Mute/unmute and remember last volume
  const toggleMute = () => {
    if (currentVolume === 0) {
      const restoredVolume = previousVolume || 0.5;
      setCurrentVolume(restoredVolume);
      if (onSetVolume) {
        onSetVolume(restoredVolume);
      }
    } else {
      setPreviousVolume(currentVolume);
      setCurrentVolume(0);
      if (onSetVolume) {
        onSetVolume(0);
      }
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Volume display with icon, percentage and dropdown trigger */}
      <div 
        className="flex flex-col w-10 items-center gap-1 text-xs text-white/90 cursor-pointer px-2 py-1 rounded hover:bg-white/10 transition-colors"
        onClick={toggleDropdown}
      >
        <FaCaretUp className="text-white/70 -mb-1" size={20} />
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="p-1 rounded hover:bg-white/10 transition-colors"
          aria-label={currentVolume === 0 ? "Unmute" : "Mute"}
        >
          <VolumeIcon currentVolume={currentVolume} iconSize={iconSize}/>
        </button>

        <span>{Math.round(currentVolume * 100)}%</span>
      </div>

      {/* Dropdown with volume slider */}
      {dropdownOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-graphite p-3 left rounded shadow-lg min-w-36">
          <div className="flex flex-row items-center gap-2">
            <VolumeIcon currentVolume={currentVolume} iconSize={iconSize}/>
            
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={currentVolume}
              onChange={handleSliderChange}
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
              onMouseUp={handleSliderRelease}
              onTouchEnd={handleSliderRelease}
              aria-label="Volume"
            />
          </div>
        </div>
      )}
    </div>
  );
}