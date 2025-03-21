import { Track } from "@frontend/shared";
import { FaPlus } from "react-icons/fa";
import { formatMs } from "../../_utils/timeUtils";
import React from "react";
import TrackInfo from "../TrackInfo";

interface TrackItemProps {
    track: Track;
    onTrackAdd?: (track: Track) => void;
    childrenLeft?: React.ReactNode;
    childrenRight?: React.ReactNode;
    showDuration ?: boolean;
}

const TrackItem = ({ track, onTrackAdd, childrenLeft, childrenRight, showDuration=true }: TrackItemProps) => {
    
    const containerWidth = showDuration 
    ? { left: 70, right: 30 } 
    : { left: 80, right: 20 };

    // TODO - Select the 64 64 image

    return (
        <div className="py-2 px-3 flex items-center justify-between gap-8 bg-white/10 text-white/90 font-poppins rounded-lg ">
            {/* Left Container */}
            <div 
                className="flex items-center"
                style={{ width: `${containerWidth.left}%` }}
            >
                {/* Left Children */}
                {childrenLeft}
                
                <TrackInfo track={track} imageSize={50}/>
                
            </div>

            {/* Right Container */}
            <div 
                className="flex justify-between items-center"
                style={{ width: `${containerWidth.right }%` }}
            >
                {/* Push add button to the right */}
                <div></div>

                {/* Track duration */}
                {
                    showDuration && track.duration_ms && 
                    <p className="text-sm">{formatMs(track.duration_ms)}</p>
                }

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