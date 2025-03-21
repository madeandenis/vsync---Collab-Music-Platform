import React from "react";
import { truncateText } from "../../_utils/textUtil";

interface ThumbnailCardProps {
    thumbnail: React.ReactNode;
    name: string;
    onClick?: () => void;
}

const ThumbnailCard= ({ thumbnail, name, onClick}: ThumbnailCardProps) => {
    return (
        <figure className="flex flex-col items-center p-2">
            <div className="w-full flex justify-center" onClick={onClick}>{thumbnail}</div>
            <figcaption className="text-md text-center mt-2 text-white opacity-90 font-poppins">
                <span title={name}>
                    {truncateText(name, 15)}
                </span>
            </figcaption>
        </figure>
    );
};

export default ThumbnailCard;
