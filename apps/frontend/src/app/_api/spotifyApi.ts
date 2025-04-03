import { Track } from "@frontend/shared";
import { fetchApi } from "../_utils/fetchUtils";

export const searchTracks = async (query: string | null): Promise<Track[]> => {
    if(!query) return Promise.resolve([]);

    return await fetchApi(`/api/spotify/search?q=${encodeURI(query)}`);
}

export const fetchAccessToken = async (): Promise<string> => {
    return await fetchApi('/api/spotify/access-token');
}

export type PlaybackRequest = {
    accessToken: string;
    deviceId: string;
    playback: {
        uris: string[];
        offset: {
            position: number;
        };
        position_ms: number;
    };
};

export async function startPlaybackOnDevice(request: PlaybackRequest) {
    return await fetchApi(`https://api.spotify.com/v1/me/player/play?device_id=${request.deviceId}`, {
        method: 'PUT',
        credentials: 'omit',
        headers: {
            'Authorization': `Bearer ${request.accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...request.playback
        }),
    });
}