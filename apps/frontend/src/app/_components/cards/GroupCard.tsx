import { Group } from "@frontend/shared";
import ThumbnailCard from "./ThumbnailCard";
import Thumbnail from "../thumbnails/Thumbnail";
import { FaRegClock, FaStop, FaUsers } from "react-icons/fa";
import { GroupOptions } from "../options/GroupOptions";
import { fetchGroupSession, startGroupSession, stopGroupSession } from "../../_api/groupsSessionApi";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useGroupsContext } from "../../contexts/groupsContext";
import { useRouter } from "next/navigation";
import { IoMdPeople } from "react-icons/io";
import { timeSinceNow } from "../../_utils/timeUtils";

interface GroupCardProps {
    group: Group;
    size: number;
}

export const GroupCard = ({ group, size }: GroupCardProps) => {
    const { refetchAll } = useGroupsContext();
    const router = useRouter();

    function redirectToGroupSession() {
        router.push(`/group/${group.id}/session`);
    }

    const { data: session, isError } = useQuery({
        queryKey: ['group-session', group.id],
        queryFn: ({ queryKey }) => fetchGroupSession(queryKey[1]),
        enabled: group.isActive,
    });

    const startSessionMutation = useMutation({
        mutationFn: () => startGroupSession(group.id),
        onSuccess: redirectToGroupSession,
        onError: () => refetchAll(),
    });

    const stopSessionMutation = useMutation({
        mutationFn: () => stopGroupSession(group.id),
        onSuccess: () => refetchAll(),
        onError: () => refetchAll(),
    });

    // Enforce cache busting
    const timestamp = new Date().getTime();

    // TODO - Solve versioning mechanism
    const imageUrl = group.imageUrl ? `${group.imageUrl}?v=${timestamp}` : undefined;

    const thumbnail = (
        <Thumbnail
            onClick={() => {
                if (group.isActive) {
                    redirectToGroupSession();
                }
            }}
            src={imageUrl ?? undefined}
            placeHolder={<FaUsers size={size / 3} />}
            alt={`${group.name}-thumbnail`}
            size={size}
        >
            {/* Group Options  */}
            <div className="absolute top-1 right-1 z-10">
                <GroupOptions
                    buttonSize={size / 7}
                    group={group}
                    startSessionAction={startSessionMutation.mutate} // Pass the start session action here
                />
            </div>

            {/* Session Actions (Stop Session is still available when active) */}
            {group.isActive && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <button
                        onClick={() => stopSessionMutation.mutate}
                        className="p-3 rounded-full text-xl text-white/40 bg-black/80"
                    >
                        <FaStop className="hover:text-red-500" />
                    </button>
                </div>
            )}

            {/* Session info overlay */}
            {session && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-1 px-2 text-xs text-white/90 font-nunito">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <IoMdPeople className="mr-1" />
                            <span>{session.participants.length}</span>
                        </div>
                        <div className="flex justify-center items-center">
                            <FaRegClock size={11} className="mr-1" />
                            {timeSinceNow(new Date(session.timestamps.createdAt))}
                        </div>
                    </div>
                </div>
            )}
        </Thumbnail>
    );

    return <ThumbnailCard thumbnail={thumbnail} name={group.name} />;
};