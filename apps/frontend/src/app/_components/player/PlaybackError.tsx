import React from "react";
import { PiWarningCircleFill } from "react-icons/pi";

type PlaybackErrorProps = {
  message: string;
};

export default function PlaybackError({ message }: PlaybackErrorProps) {
  return (
    <div className="flex items-center gap-4 p-2">
      <PiWarningCircleFill size={38} className="text-white/90" />
      <div>
        <h1 className="text-lg text-white/80 font-semibold">Playback Unavailable</h1>
        <p className="w-[80%] text-xs text-white/70">{message}</p>
      </div>
    </div>
  );
};


