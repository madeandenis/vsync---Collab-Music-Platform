"use client";

import React from "react";
import { FaSpotify } from 'react-icons/fa';
import { SiYoutubemusic } from 'react-icons/si';
import { Provider } from "../_types/provider";
import useAuth from "../_hooks/useAuth";

interface OAuthBtnProps
{
    provider: Provider
}   

export default function OAuthBtn({provider}: OAuthBtnProps) 
{
    const { initAuth } = useAuth();
    function handleClick() {
        initAuth(provider, "/user/profile");
    };

    let icon: React.ReactNode;
    
    switch (provider){
        case Provider.Spotify:
            icon = <FaSpotify className="text-spotifyGreen" size={36} />
            break;
        case Provider.YoutubeMusic:
            icon = <SiYoutubemusic className="text-ytMusicRed" size={36} />
            break;
        default:
            icon = null;
    }

    return (
        <button
            className={`bg-black text-gray-50 bg-opacity-50 opacity-90 px-4 py-4 rounded-2xl border-r-4 border-b-4 border-black`}
            onClick={handleClick}
        >
            <div className="flex items-center"> {icon} </div>
        </button>
    )
}