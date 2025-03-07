import { extractUserId } from "../_utils/userUtils";
import { GroupCard } from "./cards/GroupCard";
import { CreateGroupCard } from "./cards/CreateGroupCard";
import { UserProfile } from "@frontend/shared";
import { useGroupsContext } from "../contexts/groupsContext";
import { Dispatch, SetStateAction, useEffect } from "react";

interface GroupsContainerProps {
    profile: UserProfile,
    cardsSize: number
    setGroupsCount?: Dispatch<SetStateAction<number>>;
}

export const GroupsContainer = ({profile, cardsSize, setGroupsCount}: GroupsContainerProps) => {
    const userId = extractUserId(profile);
    const { groups } = useGroupsContext();

    useEffect(() => {
        if(setGroupsCount && groups){
            setGroupsCount(groups.length);
        }
    }, [groups, setGroupsCount])

    return (
        <div className="container mx-auto p-8 h-full w-3/4 max-w-3xl bg-white/5 rounded-xl">
            <h2 className="text-2xl text-white/95 font-poppins font-semibold mb-2">Your Groups</h2>
            <div className="flex flex-wrap gap-2 w-full h-[calc(100%-10px)] overflow-y-auto scrollbar">
                <CreateGroupCard size={cardsSize}/>
                {
                    groups && groups.length > 0 && groups.map(group => (
                        <GroupCard key={group.id} group={group} size={cardsSize} />
                    ))
                }
            </div>
        </div>
    )
}