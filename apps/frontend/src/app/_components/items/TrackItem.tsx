import { Track } from "@frontend/shared";
import { FaPlus } from "react-icons/fa";
import { formatMs } from "../../_utils/timeUtils";
import React from "react";

interface TrackItemProps {
    track: Track;
    onTrackAdd?: (track: Track) => void;
    childrenLeft?: React.ReactNode;
    childrenRight?: React.ReactNode;
}

const TrackItem = ({ track, onTrackAdd, childrenLeft, childrenRight }: TrackItemProps) => {
    const { name, album, artists, duration_ms } = track;

    return (
        <div className="py-2 px-3 flex items-center justify-between bg-white/10 text-white/90 rounded-lg font-poppins">
            <div className="flex items-center">
                {/* Left Children */}
                {childrenLeft}
                {
                    album && album.imageUrl &&
                    <img
                        src={album.imageUrl}
                        alt={album.name}
                        className="rounded-lg"
                        style={{ width: `${50}px`, height: `${50}px` }}
                    />
                }
                <div className="flex flex-col ml-2">
                    {/* Track Name */}
                    <h3 className="font-semibold text-md">{name}</h3>
                    {/* Artists */}
                    {
                        artists &&
                        <p className="text-xs text-white/80">
                            {artists.map((artist) => artist.name).join(', ')}
                        </p>
                    }
                </div>
            </div>

            <div className="flex justify-center items-center gap-4">
                {/* Track duration */}
                <p className="text-sm">{duration_ms && formatMs(duration_ms)}</p>

                {/* Add button */}
                {
                    onTrackAdd &&
                    <div
                        className="p-2 rounded-lg hover:bg-white/10"
                        onClick={() => onTrackAdd(track)}
                    >
                        <FaPlus
                            className="opacity-70 cursor-pointer hover:opacity-100"
                            size={20}
                        />
                    </div>
                }

                {/* Right Children */}
                {childrenRight}

            </div>
        </div>
    );
};

export default TrackItem;