import React from "react";
import { GroupSession, ScoredTrack } from "@frontend/shared";
import DraggableList from "../lists/DraggableList";
import ScoredTrackItem from "../items/ScoredTrackItem";
import { GroupSocketActions } from "../../_hooks/group/useGroupSocket";
import { Playback } from "../../_types/playback";

interface TrackQueueProps {
  queue: ScoredTrack[];
  sessionSettings: GroupSession['settings'];
  onQueueReorder: (reorderedQueue: ScoredTrack[]) => void;
  player: Playback.Controller | null;
  queueEmitters: GroupSocketActions['queue']; 
}

const TrackQueue = ({
  queue,
  sessionSettings,
  onQueueReorder,
  player,
  queueEmitters,
}: TrackQueueProps) => {

  const getTrackId = (scoredTrack: ScoredTrack) => scoredTrack.queuedTrack.trackDetails.id;

  const renderScoredTrack = (scoredTrack: ScoredTrack) => (
    <ScoredTrackItem
      key={getTrackId(scoredTrack)}
      scoredTrack={scoredTrack}
      onPlay={player?.play}
      onUpvote={queueEmitters.upvote}
      onDownvote={queueEmitters.downvote}
      onWithdrawVote={queueEmitters.withdrawVote}
      removeTrack={queueEmitters.remove}
      isVoteSystemEnabled={sessionSettings.isVoteSystemEnabled}
      isQueueReorderingEnabled={sessionSettings.isQueueReorderingEnabled}
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
