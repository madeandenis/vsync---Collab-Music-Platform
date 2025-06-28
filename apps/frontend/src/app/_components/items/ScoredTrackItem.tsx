import { QueuedTrack, ScoredTrack } from "@frontend/shared";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TrackItem from "./TrackItem";
import VoteButton from "../buttons/VoteButton";
import { RxDragHandleDots2 } from "react-icons/rx";
import { TrackOptions } from "../options/TrackOptions";

interface ScoredTrackItemProps {
    scoredTrack: ScoredTrack;
    onPlay?: (trackId: string) => void;
    onDownvote: (track: QueuedTrack) => void;
    onUpvote: (track: QueuedTrack) => void;
    onWithdrawVote: (track: QueuedTrack) => void;
    removeTrack: (track: QueuedTrack) => void;
    isVoteSystemEnabled: boolean;
    isQueueReorderingEnabled: boolean;
}

const ScoredTrackItem = ({
    scoredTrack,
    onPlay,
    onUpvote,
    onDownvote,
    onWithdrawVote,
    removeTrack,
    isVoteSystemEnabled,
    isQueueReorderingEnabled
}: ScoredTrackItemProps) => {

    const { queuedTrack, score } = scoredTrack;
    const { trackDetails } = queuedTrack;

    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: trackDetails.id,
        disabled: !isQueueReorderingEnabled
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const leftComponent = isQueueReorderingEnabled ? (
        <div>
            <RxDragHandleDots2
                size={26}
                {...listeners}
                className="mr-1 text-white/70 cursor-grab"
            />
        </div>
    ) : undefined;
    
    const rightComponent = (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1">
            {isVoteSystemEnabled && (
                <VoteButton
                    onUpvote={() => onUpvote(queuedTrack)}
                    onDownvote={() => onDownvote(queuedTrack)}
                    onWithdrawVote={() => onWithdrawVote(queuedTrack)}
                    voteCount={score}
                />
            )}
            <TrackOptions
                buttonSize={20}
                removeTrack={() => removeTrack(queuedTrack)}
            />
        </div>
    );

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className="cursor-default"
        >
            <TrackItem
                track={trackDetails}
                onPlay={onPlay}
                childrenLeft={leftComponent}
                childrenRight={rightComponent}
            />
        </div>
    );
};

export default ScoredTrackItem;