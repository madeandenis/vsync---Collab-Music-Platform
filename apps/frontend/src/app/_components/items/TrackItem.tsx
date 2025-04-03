import { Track } from "@frontend/shared";
import { FaPlay, FaPlus } from "react-icons/fa";
import { formatMs } from "../../_utils/timeUtils";
import React from "react";
import { truncateText } from "../../_utils/textUtil";
import { useMediaQuery } from "react-responsive";

interface TrackItemProps {
    track: Track;
    onAdd?: (track: Track) => void;
    onPlay?: (trackId: string) => void;
    childrenLeft?: React.ReactNode;
    childrenRight?: React.ReactNode;
    showDuration?: boolean;
}

const TrackItem = ({ track, onAdd, onPlay, childrenLeft, childrenRight, showDuration = true }: TrackItemProps) => {

    const isSmallScreen = useMediaQuery({ minWidth: 500 });
    
    const containerWidth = showDuration
        ? { left: 60, right: 40 }
        : { left: 80, right: 20 };

    const textWidth = isSmallScreen ? undefined : 25; 

    // TODO - Select the 64 64 image
    var albumImageUrl: string | undefined = undefined;
    if (track.album) {
        if ('imageUrl' in track.album) {
            albumImageUrl = track.album.imageUrl;
        }
        else {
            albumImageUrl = track.album.images?.[0]?.url;
        }
    }

    const handlePlayClick = () => {
        if (onPlay && track.id) {
            onPlay(track.id);
        }
    };

    return (
        <div className="p-2 flex items-center justify-between gap-8 bg-white/10 text-white/90 font-poppins rounded-lg ">
            {/* Left Container */}
            <div
                className="flex items-center"
                style={{ width: `${containerWidth.left}%` }}
            >
                {/* Left Children */}
                {childrenLeft}

                {/* Track Info */}
                <div className="flex flex-row items-center font-poppins">
                    {/* Album Image with Overlay and Play Button */}
                    {albumImageUrl && (
                        <div className="relative rounded-lg">
                            <img
                                src={albumImageUrl}
                                alt={track.album?.name}
                                className="rounded-lg"
                                style={{ width: "10vw", maxWidth: "60px", minWidth: "50px" }}
                            />
                            {
                                onPlay &&
                                <div className="absolute inset-0 flex justify-center items-center rounded-lg bg-black/60 opacity-0 hover:opacity-100 transition-opacity duration-300">
                                    <button
                                        className="play-button text-white bg-transparent rounded-full p-3"
                                        onClick={handlePlayClick}
                                    >
                                        <FaPlay />
                                    </button>
                                </div>
                            }
                        </div>
                    )}
                    <div className="flex flex-col ml-2 gap-1">
                        {/* Track Name */}
                        <h3 className={`font-semibold text-white/90 text-sm`}>
                            {truncateText(track.name, textWidth)}
                        </h3>
                        {/* Artists */}
                        {track.artists && (
                            <p className={`text-white/70 text-xs`}>
                                {truncateText(track.artists.map((artist) => artist.name).join(", "), textWidth)}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Container */}
            <div
                className="flex justify-between items-center"
                style={{ width: `${containerWidth.right}%` }}
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
                    onAdd &&
                    <div
                        className="p-2 rounded-lg hover:bg-white/10"
                        onClick={() => onAdd(track)}
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