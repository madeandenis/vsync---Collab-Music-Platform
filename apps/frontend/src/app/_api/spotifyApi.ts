import { Track, UserProfile } from "@frontend/shared";
import { fetchApi } from "../_utils/fetchUtils";

export const searchTracks = async (query: string | null): Promise<Track[]> => {
    if(!query) return Promise.resolve([]);

    return await fetchApi(`/api/spotify/search?q=${encodeURI(query)}`);
}
