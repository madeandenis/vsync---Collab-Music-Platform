import { Group } from "@frontend/shared";
import ThumbnailCard from "./ThumbnailCard";
import Thumbnail from "../thumbnails/Thumbnail";
import { FaEllipsisH, FaUsers } from "react-icons/fa";
import { GroupOptions } from "../GroupOptions";

interface GroupCardProps {
    group: Group;
    size: number
}

export const GroupCard = ({ group, size }: GroupCardProps) => {

    const thumbnail = (
        <Thumbnail
            src={group.imageUrl ?? undefined}
            placeHolder={<FaUsers size={size/2} />}
            alt={`${group.name}-thumbnail`}
            size={size}
        >
            <div className="absolute top-1 right-1 z-10">
                <GroupOptions size={size/7} activeSession={group.isActive}/>    
            </div>
        </Thumbnail>
    );

    return (
        <ThumbnailCard
            thumbnail={thumbnail}
            name={group.name}
        />
    )
}                                               