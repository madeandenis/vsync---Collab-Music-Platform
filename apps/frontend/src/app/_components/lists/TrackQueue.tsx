import React from "react";
import { GroupSession, ScoredTrack } from "@frontend/shared";
import DraggableList from "../lists/DraggableList";
import ScoredTrackItem from "../items/ScoredTrackItem";
import { GroupSocketActions } from "../../_hooks/useGroupSocket";
import { PlaybackControls } from "../../_hooks/useSpotifyPlayback";

interface TrackQueueProps {
  queue: ScoredTrack[];
  sessionSettings: GroupSession['settings'];
  onQueueReorder: (reorderedQueue: ScoredTrack[]) => void;
  playbackControls: PlaybackControls;
  socketActions: GroupSocketActions; 
}

const TrackQueue = ({
  queue,
  sessionSettings,
  onQueueReorder,
  playbackControls,
  socketActions,
}: TrackQueueProps) => {

  const { queue: queueActions } = socketActions;

  const getTrackId = (scoredTrack: ScoredTrack) => scoredTrack.queuedTrack.trackDetails.id;

  const renderScoredTrack = (scoredTrack: ScoredTrack) => (
    <ScoredTrackItem
      key={getTrackId(scoredTrack)}
      scoredTrack={scoredTrack}
      onPlay={playbackControls.play}
      onUpvote={queueActions.upvote}
      onDownvote={queueActions.downvote}
      onWithdrawVote={queueActions.withdrawVote}
      removeTrack={queueActions.remove}
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
