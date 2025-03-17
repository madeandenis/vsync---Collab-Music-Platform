import React from "react";
import { QueuedTrack, ScoredTrack } from "@frontend/shared";
import DraggableList from "../lists/DraggableList";
import ScoredTrackItem from "../items/ScoredTrackItem";

interface TrackQueueProps {
  queue: ScoredTrack[];
  onQueueReorder: (reorderedQueue: ScoredTrack[]) => void;
  onDownvote: (track: QueuedTrack) => void;
  onUpvote: (track: QueuedTrack) => void;
}

const TrackQueue = ({ queue, onQueueReorder, onUpvote, onDownvote }: TrackQueueProps) => {

  const getTrackId = (scoredTrack: ScoredTrack) => scoredTrack.queuedTrack.trackDetails.id;
  const renderScoredTrack = (scoredTrack: ScoredTrack) => (
    <ScoredTrackItem
      key={getTrackId(scoredTrack)}
      scoredTrack={scoredTrack}
      onUpvote={onUpvote}
      onDownvote={onDownvote}
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
