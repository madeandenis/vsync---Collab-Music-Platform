"use client";

import { useState } from "react";
import ProfileCard from "../../../_components/cards/ProfileCard";
import { GroupsContainer } from "../../../_components/GroupsContainer";
import LoadingOverlay from "../../../_components/LoadingOverlay";
import { ProfileHeader } from "../../../_components/ProfileHeader";
import { GroupsProvider } from "../../../contexts/groupsContext";
import { useUserContext } from "../../../contexts/userContext";

export default function ProfilePage() {
    const [groupsCount, setGroupsCount] = useState(0);
    const { profile } = useUserContext();

    if (!profile) return <LoadingOverlay />

    return (
        <div className="flex flex-col gap-8 w-screen h-screen bg-ytMusicBlack subtle-colorful-bg overflow-hidden">
            <ProfileHeader opacity={40} />
            <ProfileCard profile={profile} groupsCount={groupsCount}/>
            <GroupsProvider profile={profile}>
                <div className="flex-grow overflow-auto mb-12">
                    <GroupsContainer profile={profile} cardsSize={150} setGroupsCount={setGroupsCount}/>
                </div>
            </GroupsProvider>
        </div>
    );
}