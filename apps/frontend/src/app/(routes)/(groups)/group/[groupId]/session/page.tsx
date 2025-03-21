'use client';

import { Track } from "@frontend/shared";
import { useQuery } from "@tanstack/react-query";
import { fetchGroup } from "apps/frontend/src/app/_api/groupsApi";
import GroupInfoCard from "apps/frontend/src/app/_components/cards/GroupInfoCard";
import TrackQueue from "apps/frontend/src/app/_components/lists/TrackQueue";
import LoadingOverlay from "apps/frontend/src/app/_components/LoadingOverlay";
import { ProfileHeader } from "apps/frontend/src/app/_components/ProfileHeader";
import TrackSearchContainer from "apps/frontend/src/app/_components/search_bars/TrackSearchContainer";
import SpotifyPlayer from "apps/frontend/src/app/_components/player/SpotifyPlayer";
import useGroupSocket from "apps/frontend/src/app/_hooks/useGroupSocket";
import { useAlertContext } from "apps/frontend/src/app/contexts/alertContext";
import { useRouter } from "next/navigation";
import { use, useEffect } from "react";

export default function GroupSessionPage({ params }: { params: Promise<{ groupId: string }> }) {
    const router = useRouter();
    const { setAlert } = useAlertContext();
    const { groupId } = use(params);

    const { data: group, isLoading: groupLoading, isError: groupError } = useQuery({
        queryKey: ["group", groupId],  
        queryFn: ({ queryKey }) => fetchGroup(queryKey[1]),
        enabled: !!groupId,
    });

    const handleDisconnect = () => {
        router.back();
    }
    const handleConnectionError = (error: string) => 
    {
        setAlert(error, 'error', 1500);
        handleDisconnect();
    }
    const handleSocketError = (error: string) => {
        setAlert(error, 'error', 1500);
    }    

    const { queue, setQueue, addTrack, upvoteTrack, downvoteTrack, session } = useGroupSocket({
        groupId,
        onDisconnect: handleDisconnect,
        onConnectionError: handleConnectionError,
        onSocketError: handleSocketError,
    });

    useEffect(() => {
        if (groupError) {
            router.back();
        }
    }, [groupError, router]);

    if (groupLoading) {
        return <LoadingOverlay />;
    }

    return (
        <div className="flex flex-col gap-6 w-screen h-screen bg-ytMusicBlack subtle-colorful-bg overflow-y-auto scrollbar">
            {/* Profile Header */}
            <ProfileHeader />
            
            {/* Group Information Card */}
            { group && <GroupInfoCard group={group} />}

            <div className="container mx-auto w-[90%] max-w-lg">
                <SpotifyPlayer queue={queue}/>
            </div>
            
            {/* Main Content Container */}
            <div className="container mx-auto w-[90%] max-w-lg rounded-xl bg-white/5 p-2 sm:p-6">
                {/* Track Search Container */}
                <TrackSearchContainer onTrackAdd={(track: Track) => addTrack(track, 0)}/>
                
                {/* Collaborative Message */}
                <div className="mt-8 mb-4 text-center font-montserrat">
                        <p className="text-sm text-white/75">
                            Add songs, vote, and shape the playlist together!
                        </p>
                </div>
                
                {/* Track Queue */}
                {
                    queue && queue.length > 0 && 
                    <TrackQueue
                        queue={queue}
                        onQueueReorder={setQueue}
                        onUpvote={upvoteTrack}
                        onDownvote={downvoteTrack}
                    />
                }
            </div>
        </div>
    );
}
