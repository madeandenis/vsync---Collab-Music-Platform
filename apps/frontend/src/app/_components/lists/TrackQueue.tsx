import React from "react";
import { QueuedTrack, ScoredTrack } from "@frontend/shared";
import DraggableList from "../lists/DraggableList";
import ScoredTrackItem from "../items/ScoredTrackItem";

interface TrackQueueProps {
  queue: ScoredTrack[];
  onQueueReorder: (reorderedQueue: ScoredTrack[]) => void;
  onPlay: (trackId: string) => void;
  onDownvote: (track: QueuedTrack) => void;
  onUpvote: (track: QueuedTrack) => void;
  onWithdrawVote: (track: QueuedTrack) => void;
  removeTrack: (track: QueuedTrack) => void;
}

const TrackQueue = ({ queue, onQueueReorder, onPlay, onUpvote, onDownvote, onWithdrawVote, removeTrack }: TrackQueueProps) => {

  const getTrackId = (scoredTrack: ScoredTrack) => scoredTrack.queuedTrack.trackDetails.id;
  const renderScoredTrack = (scoredTrack: ScoredTrack) => (
    <ScoredTrackItem
      key={getTrackId(scoredTrack)}
      scoredTrack={scoredTrack}
      onPlay={onPlay}
      onUpvote={onUpvote}
      onDownvote={onDownvote}
      onWithdrawVote={onWithdrawVote}
      removeTrack={removeTrack}
    />
  );

  return (
    <DraggableList<ScoredTrack>
      items={queue}
      renderItem={renderScoredTrack}
      onItemsChange={onQueueReorder}
      getId={getTrackId}
    />
  );
};

export default TrackQueue;
