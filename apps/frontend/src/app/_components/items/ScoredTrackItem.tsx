import { QueuedTrack, ScoredTrack } from "@frontend/shared";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TrackItem from "./TrackItem";
import VoteButton from "../VoteButton";
import { RiDragMoveFill } from "react-icons/ri";

interface ScoredTrackItemProps 
{
    scoredTrack: ScoredTrack;    
    onDownvote: (track: QueuedTrack) => void;
    onUpvote: (track: QueuedTrack) => void;
}

const ScoredTrackItem = ({ scoredTrack, onUpvote, onDownvote }: ScoredTrackItemProps) => {
    const { queuedTrack, score } = scoredTrack;
    const { trackDetails } = queuedTrack;

    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: trackDetails.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const leftComponent = ( 
        <div className="-ml-1 mr-2 text-white/75">
            <RiDragMoveFill
                size={26} 
                {...listeners}
                style={{ cursor: "grab" }}
            />
        </div>
    );
    const rightComponent = (
        <VoteButton 
            onUpvote={() => onUpvote(queuedTrack)} 
            onDownvote={() => onDownvote(queuedTrack)} 
            voteCount={score}
        />
    );

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
        >
            <TrackItem 
                track={trackDetails}
                childrenLeft={leftComponent}
                childrenRight={rightComponent}
            />
        </div>
    );
};

export default ScoredTrackItem;