import { Track } from "@frontend/shared";
import { Spotify } from "../_types/spotify";
import { FaPlay } from "react-icons/fa";

interface TrackInfoProps {
    track: Track | Spotify.WebPlaybackTrack;
    size: 'small' | 'medium';
    onPlay?: (trackId: string) => void;
}

export default function TrackInfo({ track, size, onPlay }: TrackInfoProps) {
    if (!track) return null;

    var albumImageUrl: string | undefined = undefined;
    if (track.album) {
        if ('imageUrl' in track.album) {
            albumImageUrl = track.album.imageUrl;
        }
        else {
            albumImageUrl = track.album.images?.[0]?.url;
        }
    }

    const imageStyle = {
        small: { width: "10vw", maxWidth: "60px", minWidth: "50px" },
        medium: { width: "20vw", maxWidth: "120px", minWidth: "70px" },
    }[size];

    const textSize = {
        trackNameSize: size === 'small' ? 'text-sm' : 'text-md',
        trackArtistSize: size === 'small' ? 'text-xs' : 'text-sm',
    };

    const handlePlayClick = () => {
        if (onPlay && track.id) {
            onPlay(track.id);
        }
    };

    return (
        <div className="flex flex-row gap-3 items-center font-poppins">
            {/* Album Image with Overlay and Play Button */}
            {albumImageUrl && (
                <div className="relative rounded-lg">
                    <img
                        src={albumImageUrl}
                        alt={track.album?.name}
                        className="rounded-lg"
                        style={imageStyle}
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
                <h3 className={`font-semibold text-white/90 ${textSize.trackNameSize}`}>
                    {track.name}
                </h3>
                {/* Artists */}
                {track.artists && (
                    <p className={`text-white/70 ${textSize.trackArtistSize}`}>
                        {track.artists.map((artist) => artist.name).join(", ")}
                    </p>
                )}
            </div>
        </div>
    );
}
