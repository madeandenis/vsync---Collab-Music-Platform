import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUserGroups } from '../_api/groupsApi';
import { extractUserId } from '../_utils/userUtils';
import { Group, UserProfile } from '@frontend/shared';
import LoadingOverlay from '../_components/LoadingOverlay';

interface GroupsContextType {
    groups: Group[] | undefined;
    isLoading: boolean;
    error: unknown;
    refetchAll: () => void;
}

const GroupsContext = createContext<GroupsContextType | undefined>(undefined);

export const GroupsProvider = ({ profile, children }: { profile: UserProfile, children: React.ReactNode }) => {
    const userId = extractUserId(profile);

    const { data: groups, error, isLoading, refetch: refetchAll } = useQuery({
        queryKey: ['groups', userId],
        queryFn: fetchUserGroups,
        enabled: !!userId,
        retry: false,
    })

    if(error) return null;

    return (
        <GroupsContext.Provider value={{ groups, error, isLoading, refetchAll }}>
            {isLoading ? <LoadingOverlay /> : children}
        </GroupsContext.Provider>
    );
};

export const useGroupsContext = (): GroupsContextType => {
    const context = useContext(GroupsContext);
    if (!context) {
        throw new Error('useGroupsContext must be used within a GroupsProvider');
    }
    return context;
};