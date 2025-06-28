import React, { useState, useEffect } from "react";
import { PiWarningCircleFill } from "react-icons/pi";
import { RiRefreshFill } from "react-icons/ri";


interface PlaybackErrorProps {
  error: string;
  onRefresh?: () => void;
}

export default function PlaybackError({ error, onRefresh }: PlaybackErrorProps) {
  const [showRefreshIcon, setShowRefreshIcon] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRefreshIcon(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 p-2">
      {showRefreshIcon ? (
        <button
          onClick={handleRefresh}
          aria-label="Refresh playback"
          className="text-white/80 focus:outline-none"
          type="button"
        >
          <RiRefreshFill size={38} />
        </button>
      ) : (
        <PiWarningCircleFill size={38} className="text-white/90" />
      )}

      <div className="flex flex-col">
        <h1 className="text-lg text-white/80 font-semibold">Playback Unavailable</h1>
        <p className="w-[80%] text-xs text-white/70">{error}</p>
      </div>
    </div>
  );
}
