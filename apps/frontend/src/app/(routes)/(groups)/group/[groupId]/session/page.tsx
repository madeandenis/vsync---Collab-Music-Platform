'use client';

import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import { fetchGroup } from "apps/frontend/src/app/_api/groupsApi";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingOverlay from "apps/frontend/src/app/_components/LoadingOverlay";
import GroupSessionContent from "./GroupSessionContent";

interface GroupSessionPageProps {
    params: Promise<{ groupId: string }>;
}

export default function GroupSessionPage({ params }: GroupSessionPageProps) {
    const { groupId } = use(params);
    const router = useRouter();

    const { data: group, isLoading, isError } = useQuery({
        queryKey: ["group", groupId],
        queryFn: ({ queryKey }) => fetchGroup(queryKey[1]),
        enabled: !!groupId,
    });

    useEffect(() => {
        if (isError) {
            setTimeout(() => {
                router.back()
            }, 2000);
        }
    }, [isError, router]);

    if (isLoading || isError || !group) {
        return (
            <div className="w-screen h-screen bg-ytMusicBlack subtle-colorful-bg">
                <LoadingOverlay message="Loading group session..." />
            </div>
        );
    }

    return <GroupSessionContent group={group} groupId={groupId} />;
}
