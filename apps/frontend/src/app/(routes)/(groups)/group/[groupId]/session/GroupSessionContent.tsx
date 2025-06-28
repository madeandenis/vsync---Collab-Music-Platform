'use client';

import { Group } from "@frontend/shared";
import { useQuery } from "@tanstack/react-query";
import { fetchGroupSessionAdminStatus } from "apps/frontend/src/app/_api/groupsSessionApi";
import GroupInfoCard from "apps/frontend/src/app/_components/cards/GroupInfoCard";
import { EditGroupForm } from "apps/frontend/src/app/_components/forms/EditGroupForm";
import TrackQueue from "apps/frontend/src/app/_components/lists/TrackQueue";
import Player from "apps/frontend/src/app/_components/player/Player";
import { ProfileHeader } from "apps/frontend/src/app/_components/ProfileHeader";
import TrackSearchContainer from "apps/frontend/src/app/_components/search_bars/TrackSearchContainer";
import SessionAdminPanel from "apps/frontend/src/app/_components/SessionAdminPanel";
import useGroupSession from "apps/frontend/src/app/_hooks/group/useGroupSession";
import usePlayback from "apps/frontend/src/app/_hooks/usePlayback";
import usePlaybackSync from "apps/frontend/src/app/_hooks/usePlaybackSync";
import { useState } from "react";
import { MdEditNote } from "react-icons/md";

interface GroupSessionContentProps {
  group: Group;
  groupId: string;
}

export default function GroupSessionContent({ group, groupId }: GroupSessionContentProps) {

  const { data: isAdmin } = useQuery({
    queryKey: ['isAdmin'],
    queryFn: () => fetchGroupSessionAdminStatus(groupId),
    enabled: !!groupId,
  });

  const {
    session, syncSession,
    queue, syncQueue,
    nowPlaying,
    socketActions,
    addTrackToQueue,
  } = useGroupSession(groupId);

  const playback = usePlayback(
    queue,
    syncQueue,
    nowPlaying,
    session?.platform,
    socketActions,
  );

  usePlaybackSync(
    nowPlaying,
    playback.states.state,
    playback.states.player,
  );

  const [openEditForm, setOpenEditForm] = useState(false);
  const panelsContainer = isAdmin && (
    <div className="flex flex-col items-center justify-center gap-2">
      {session && (
        <SessionAdminPanel
          session={session}
          setSession={syncSession}
        />
      )}

      <button
        className="p-1 bg-white/10 rounded-xl cursor-pointer z-49 relative"
        title="Edit Group"
        onClick={() => setOpenEditForm(true)}
      >
        <MdEditNote className="text-white/70" size={28} />
      </button>

      {openEditForm && (
        <EditGroupForm
          setOpen={setOpenEditForm}
          group={group}
          refetchAll={() => window.location.reload()}
        />
      )}
    </div>
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
          panel={panelsContainer}
        />
      </div>

      {/* Player */}
      <div className="container mx-auto w-[90%] max-w-xl">
        <Player
          playback={playback}
          nowPlaying={nowPlaying}
        />
      </div>

      {/* Remove */}
      {
        false &&
        <div className="container mx-auto w-[90%] max-w-xl text-white/60">
          <details className="bg-white/5 rounded-xl p-4 w-full">
            <summary className="cursor-pointer text-lg text-center">
              Show Spotify State
              {<br />}
              {'Player Ready: ' + (playback.states.player ? 'true' : 'false')}
              {<br />}
              {'Playback Track: ' + playback.states.state?.track_window?.current_track?.name}
              {<br />}
              {'NowPlaying Session Track: ' + nowPlaying?.track.name}
            </summary>
            <pre className="whitespace-pre-wrap mt-3 overflow-x-auto max-h-96 text-sm">
              {JSON.stringify(playback.states.state, null, 2)}
            </pre>
          </details>
        </div>
      }

      {/* Main Content */}
      <div className="container mx-auto w-[90%] max-w-xl rounded-xl bg-white/5 p-2 sm:p-6">
        <TrackSearchContainer onTrackAdd={addTrackToQueue} />

        <div className="mt-8 mb-4 text-center font-montserrat">
          <p className="text-sm text-white/75">
            Add songs, vote, and shape the playlist together!
          </p>
        </div>

        {/* Track Queue */}
        {session && queue.length > 0 && (
          <TrackQueue
            queue={queue}
            onQueueReorder={syncQueue}
            player={playback.states.player}
            queueEmitters={socketActions['queue']}
            sessionSettings={session.settings}
          />
        )}
      </div>
    </div>
  );
}
