"use client";

import { UserProfile } from "@frontend/shared";
import { useQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import { fetchUserProfile } from "../_api/profileApi";

interface UserContextValues {
    profile: UserProfile | undefined | null;
    error: Error | null;
}

const UserContext = createContext<UserContextValues | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const { data: profile, error } = useQuery({
        queryKey: ['user'],
        queryFn: fetchUserProfile,
        retry: false
    })

    return (
        <UserContext.Provider value={{ profile, error }}>
            {children}
        </UserContext.Provider>
    )
}

export const useUserContext = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw Error('User context hook must be used within UserProvider')
    }
    return context;
}
