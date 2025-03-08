import { Group } from "@frontend/shared";
import ThumbnailCard from "./ThumbnailCard";
import Thumbnail from "../thumbnails/Thumbnail";
import { FaPlay, FaStop, FaUsers } from "react-icons/fa";
import { GroupOptions } from "../GroupOptions";
import { startGroupSession, stopGroupSession } from "../../_api/groupsSessionApi";
import { useMutation } from "@tanstack/react-query";
import { useGroupsContext } from "../../contexts/groupsContext";
import { JSX } from "react";

interface GroupCardProps {
    group: Group;
    size: number
}

export const GroupCard = ({ group, size }: GroupCardProps) => {

    const { refetchAll } = useGroupsContext();

    const startSessionMutation = useMutation({
        mutationFn: () => startGroupSession(group.id),
        onSuccess: () => refetchAll(),
        onError: () => refetchAll(),
    });

    const stopSessionMutation = useMutation({
        mutationFn: () => stopGroupSession(group.id),
        onSuccess: () => refetchAll(),
        onError: () => refetchAll(),
    });

    const sessionAction = group.isActive ?
        {
            title: "Stop Session",
            icon: <FaStop className="hover:text-red-500" />,
            action: stopSessionMutation.mutate,
        } :
        {
            title: "Start Session",
            icon: <FaPlay className="hover:text-green-500" />,
            action: startSessionMutation.mutate,
        };

    // Enforce cache busting 
    const timestamp = new Date().getTime();
    const imageUrl = group.imageUrl ? `${group.imageUrl}?v=${timestamp}` : undefined;

    const thumbnail = (
        <Thumbnail
            src={imageUrl ?? undefined}
            placeHolder={<FaUsers size={size / 2} />}
            alt={`${group.name}-thumbnail`}
            size={size}
        >
            <div className="absolute top-1 right-1 z-10">
                <GroupOptions buttonSize={size / 7} group={group} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
                <button
                    onClick={() => sessionAction.action()}
                    className={`p-3 rounded-full text-xl text-white/40 bg-black/80 `}
                >
                    {sessionAction.icon}
                </button>
            </div>
        </Thumbnail>
    );

    const groupName: string | JSX.Element = group.isActive ?
        <div>
            {group.name}
            <span className="ml-2 text-green-500 text-xl drop-shadow-[0_0_5px_#0f0]">●</span>
        </div> 
        :
        group.name

    return (
        <ThumbnailCard
            thumbnail={thumbnail}
            name={groupName}
        />
    )
}                                               