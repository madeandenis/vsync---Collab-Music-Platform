import { Track } from "@frontend/shared";

interface TrackInfoProps {
    track: Track;
    imageSize: number;
}

export default function TrackInfo({track, imageSize}: TrackInfoProps) {

    if(!track) return null;
    
    const { name, album, artists } = track;
    return (
        <div className="flex flex-row items-center font-poppins">
            {/* Album Image */}
            {
                album && album.imageUrl &&
                <img
                    src={album.imageUrl}
                    alt={album.name}
                    className="rounded-lg"
                    style={{ width: `${imageSize}px`, height: `${imageSize}px` }}
                />
            }
            <div className="flex flex-col ml-2 gap-1">
                {/* Track Name */}
                <h3 className="font-semibold text-sm text-white/90">{name}</h3>
                {/* Artists */}
                {
                    artists &&
                    <p className="text-xs text-white/80">
                        {artists.map((artist) => artist.name).join(', ')}
                    </p>
                }
            </div>
        </div>
    )
}