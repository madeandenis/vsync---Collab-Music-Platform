import { Track } from "@frontend/shared";
import { FaPlay } from "react-icons/fa";
import { Spotify } from "../_types/spotify";

interface TrackInfoProps {
    track: Track | Spotify.WebPlaybackTrack;
    albumImageUrl: string;
}

export default function TrackInfo({ track, albumImageUrl }: TrackInfoProps) {
    if (!track) return null;

    const imageStyle = { width: "18vw", minWidth: "80px", maxWidth: "120px" };

    return (
        <div className="flex flex-row gap-3 items-center font-poppins justify-center">
            {/* Album Image with Overlay and Play Button */}
            {albumImageUrl && (
                <div className="relative rounded-lg shadow-hover-black">
                    <img
                        src={albumImageUrl}
                        alt={track.album?.name}
                        className="rounded-lg"
                        style={imageStyle}
                    />
                </div>
            )}
            <div className="flex flex-col ml-2 gap-1">
                {/* Track Name */}
                <h3 className="font-semibold text-white/90 text-md">
                    {track.name}
                </h3>
                {/* Artists */}
                {track.artists && (
                    <p className="text-white/70 text-sm">
                        {track.artists.map((artist) => artist.name).join(", ")}
                    </p>
                )}
            </div>
        </div>
    );
}
