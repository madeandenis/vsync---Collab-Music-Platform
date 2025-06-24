'use client';

import { Track, Group, GroupSession, ScoredTrack } from "@frontend/shared";

// Components
import GroupInfoCard from "apps/frontend/src/app/_components/cards/GroupInfoCard";
import TrackQueue from "apps/frontend/src/app/_components/lists/TrackQueue";
import { ProfileHeader } from "apps/frontend/src/app/_components/ProfileHeader";
import TrackSearchContainer from "apps/frontend/src/app/_components/search_bars/TrackSearchContainer";
import SpotifyPlayer from "apps/frontend/src/app/_components/player/SpotifyPlayer";
import SessionAdminPanel from "apps/frontend/src/app/_components/SessionAdminPanel";

// Hooks
import useGroupSocket, { GroupSocketEventHandlers } from "apps/frontend/src/app/_hooks/useGroupSocket";
import { useSpotifyPlayback } from "apps/frontend/src/app/_hooks/useSpotifyPlayback";

// Context
import { useQueueManagement } from "apps/frontend/src/app/_hooks/useQueueManagement";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAlertContext } from "apps/frontend/src/app/contexts/alertContext";

interface GroupSessionContentProps {
  group: Group;
  groupId: string;
}

export default function GroupSessionContent({ group, groupId }: GroupSessionContentProps) {
  const { setAlert } = useAlertContext();
  const errorDuration = 1500;

  const router = useRouter();

  // ** State Management **
  const [session, setSession] = useState<GroupSession | null>(null);
  const [queue, setQueue] = useState<ScoredTrack[]>([]);
  const [nowPlaying, setNowPlaying] = useState<GroupSession['nowPlaying'] | null>(null);

  // ** Event Handlers **
  const eventHandlers: GroupSocketEventHandlers = {
    onQueueUpdate: setQueue,
    onSessionUpdate: setSession,
    onNowPlayingUpdate: setNowPlaying,
    onDisconnect: useCallback(() => {
      setAlert('Disconnected from session', 'info', errorDuration);
      router.back();
    }, [router, setAlert]),
  
    onError: useCallback((error: string) => {
      setAlert(error, 'error', errorDuration);
    }, [router, setAlert]),
  };

  // ** Group Socket **
  const { actions: socketActions } = useGroupSocket(groupId, eventHandlers);

  // ** Spotify Playback **
  const emitters = {
    emitPauseTrack: socketActions.playback.pause,
    emitResumeTrack: socketActions.playback.resume,
    emitPlayTrack: socketActions.playback.play,
    emitNextTrack: socketActions.playback.next,
    emitPreviousTrack: socketActions.playback.previous,
    emitSeekTrack: socketActions.playback.seek,
  }
  const { playerState, playbackControls } = useSpotifyPlayback(queue, setQueue, emitters);

  // ** Queue Management **
  useQueueManagement(
    playerState.player,
    playerState.state,
    queue, 
    setQueue,
    playbackControls.play
  );

  const handleAddTrack = (track: Track) => {
    const leadTrackScore = queue[0]?.score ?? 0;
    socketActions.queue.add(track, queue.length ? leadTrackScore : leadTrackScore + 1);
  };

  const handleQueueReorder = useCallback((newQueue: ScoredTrack[]) => {
    setQueue(newQueue);
    socketActions.syncQueue(newQueue);
  }, [socketActions]);
  
  const setAndSyncSession = useCallback((newSession: GroupSession) => {
    setSession(newSession)
    socketActions.syncSession(newSession);
  }, [socketActions]);
  
  const sessionAdminPanel = session && (
    <SessionAdminPanel
      session={session}
      setSession={setAndSyncSession}
    />
  );

  return (
    <div className="flex flex-col gap-6 w-screen h-screen bg-ytMusicBlack subtle-colorful-bg overflow-y-auto scrollbar">
      {/* Header */}
      <ProfileHeader />

      {/* Group Card */}
      <div className="container mx-auto w-[90%] max-w-xl rounded-xl bg-white/5 p-6">
        <GroupInfoCard
          group={group}
          session={session}
          sessionAdminPanel={sessionAdminPanel}
        />
      </div>

      {/* Player */}
      <div className="container mx-auto w-[90%] max-w-xl">
        <SpotifyPlayer
          isQueueEmpty={!queue.length}
          nowPlaying={nowPlaying}
          playerState={playerState}
          playbackControls={playbackControls}
        />
      </div>

      {/* Main Content */}
      <div className="container mx-auto w-[90%] max-w-xl rounded-xl bg-white/5 p-2 sm:p-6">
        <TrackSearchContainer onTrackAdd={handleAddTrack} />

        <div className="mt-8 mb-4 text-center font-montserrat">
          <p className="text-sm text-white/75">
            Add songs, vote, and shape the playlist together!
          </p>
        </div>

        {/* Track Queue */}
        {session && queue.length > 0 && (
          <TrackQueue
            queue={queue}
            onQueueReorder={handleQueueReorder}
            socketActions={socketActions}
            playbackControls={playbackControls}
            sessionSettings={session.settings}
          />
        )}
      </div>
    </div>
  );
}
