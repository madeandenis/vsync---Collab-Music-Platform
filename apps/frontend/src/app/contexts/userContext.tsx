"use client";

import { UserProfile } from "@frontend/shared";
import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
import { fetchUserProfile } from "../_api/profileApi";

const PROFILE_EXPIRY_TIME = 1000 * 60 * 60;

interface UserContextValues {
    profile: UserProfile | null;
    error: Error | null;
}

const UserContext = createContext<UserContextValues | undefined>(undefined);

// TODO - add an expiry for 'userProfile'
export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [hydratedProfile, setHydratedProfile] = useState(false); 

    useEffect(() => {
        setIsClient(true); // flag when it mounts on the client side
    }, []);
    
    useEffect(() => {
        if (isClient) { // attempt to read from localStorage once the component is mounted
            const serialized = localStorage.getItem("userProfile");
            if (serialized) {
                setProfile(JSON.parse(serialized) as UserProfile);
            }
            setHydratedProfile(true); // set to true after localStorage check
        }
    }, [isClient]);

    const { data, error } = useQuery({
        queryKey: ['user-profile'],
        queryFn: fetchUserProfile,
        enabled: !profile && hydratedProfile,
        retry: false
    })

    // update profile when new data is fetched from the query
    useEffect(() => {
        if (data) {
            setProfile(data);
            if (isClient) {
                localStorage.setItem("userProfile", JSON.stringify(data));
            }
        }
    }, [data, isClient])

    useEffect(() => {
        if (error) {
            setProfile(null);
            if (isClient) {
                localStorage.removeItem("userProfile");
            }
        }
    }, [error, isClient])

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
