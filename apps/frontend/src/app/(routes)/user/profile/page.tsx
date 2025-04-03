"use client";

import { useEffect, useState } from "react";
import ProfileCard from "../../../_components/cards/ProfileCard";
import { GroupsContainer } from "../../../_components/GroupsContainer";
import LoadingOverlay from "../../../_components/LoadingOverlay";
import { ProfileHeader } from "../../../_components/ProfileHeader";
import { GroupsProvider } from "../../../contexts/groupsContext";
import { useUserContext } from "../../../contexts/userContext";

export default function ProfilePage() {
    const [groupsCount, setGroupsCount] = useState(0);
    const { profile } = useUserContext();
    const [cardSize, setCardSize] = useState(170); 

    useEffect(() => {
        const updateCardSize = () => {
            setCardSize(Math.min(window.innerWidth * 0.4, 180)); 
        };

        updateCardSize(); 
        window.addEventListener("resize", updateCardSize);
        return () => window.removeEventListener("resize", updateCardSize);
    }, []);
    if (!profile) return <LoadingOverlay />

    return (
        <div className="flex flex-col w-screen h-screen bg-ytMusicBlack subtle-colorful-bg overflow-hidden">
            <ProfileHeader/>
            <div className="flex flex-col gap-6 overflow-y-auto scrollbar">
                {/* For scrollbar to appear from top */}
                <div></div> 
                <ProfileCard profile={profile} groupsCount={groupsCount}/>
                <GroupsProvider profile={profile}>
                    <GroupsContainer cardsSize={cardSize} setGroupsCount={setGroupsCount}/>
                </GroupsProvider>
            </div>
        </div>
    );
}