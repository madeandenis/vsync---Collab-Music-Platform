import { GroupCard } from "./cards/GroupCard";
import { CreateGroupCard } from "./cards/CreateGroupCard";
import { useGroupsContext } from "../contexts/groupsContext";
import { Dispatch, SetStateAction, useEffect } from "react";

interface GroupsContainerProps {
    cardsSize: number
    setGroupsCount?: Dispatch<SetStateAction<number>>;
}

export const GroupsContainer = ({cardsSize, setGroupsCount}: GroupsContainerProps) => {
    const { groups } = useGroupsContext();

    useEffect(() => {
        if(setGroupsCount && groups){
            setGroupsCount(groups.length);
        }
    }, [groups, setGroupsCount])

    return (
        <div className="container mx-auto w-[90%] max-w-lg rounded-xl bg-white/5 p-6 font-poppins">
            <div className="flex flex-wrap items-center justify-center gap-2 overflow-y-auto scrollbar">
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