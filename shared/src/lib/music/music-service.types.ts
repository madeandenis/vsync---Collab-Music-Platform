import { MusicPlatform } from '@prisma/client'; 

export interface TokenData {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    scope: string; 
}

export interface UserProfile {
    id: string;
    display_name?: string;
    email: string;
    country?: string;
    followers?: {
        total: number;
    };
    images?: Array<{
        url: string;
        height?: number;
        width?: number;
    }>;
    platform: MusicPlatform;
    product?: 'premium' | 'free' | 'open' | string;
    external_urls?: {
        spotify?: string;
        youtubemusic?: string;
    };
}

export interface Track {
    id: string;
    name: string;
    album?: {
        id: string;
        name: string;
        images?: { url: string }[]; 
        imageUrl?: string;
    };
    artists?: Array<{
        id?: string;
        name: string;
    }>;
    href?: string; 
    preview_url?: string; 
    video_url?: string; 
    duration_ms?: number;
    platform?: MusicPlatform;
}

export interface Playlist {
    id: string;
    name: string;
    description?: string;
    images?: Array<{ url: string }>;
    tracks?: {
        total: number;
    };    
    owner?: {
        id: string;
        display_name: string;
    };
    public?: boolean;
    platform?: MusicPlatform;
    external_url?: string; 
}
