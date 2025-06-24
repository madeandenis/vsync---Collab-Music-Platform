import { useEffect, useState } from "react";

const VOLUME_STORAGE_KEY = "player-volume";

export function useVolumeControl(initialVolume = 0.5) {
  const [volume, setVolume] = useState(() => {
    const savedVolume = localStorage.getItem(VOLUME_STORAGE_KEY);
    return savedVolume ? parseFloat(savedVolume) : initialVolume;
  });

  // Persist volume changes to localStorage
  useEffect(() => {
    localStorage.setItem(VOLUME_STORAGE_KEY, volume.toString());
  }, [volume]);

  // Function to set volume with optional validation
  const setPlayerVolume = (newVolume: number) => {
    const validatedVolume = Math.max(0, Math.min(1, newVolume)); 
    setVolume(validatedVolume);
    return validatedVolume;
  };

  return {
    volume,
    setVolume: setPlayerVolume,
  };
}