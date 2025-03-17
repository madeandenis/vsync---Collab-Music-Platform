import { useQuery } from "@tanstack/react-query"
import { useCallback, useRef, useState } from "react"
import { searchTracks } from "../../_api/spotifyApi";
import SearchBar from "./SearchBar";
import ItemList from "../lists/ItemList";
import TrackItem from "../items/TrackItem";
import { Track } from "@frontend/shared";

export default function TrackSearchContainer({ onTrackAdd }: { onTrackAdd: (track: Track) => void }) {
    const [searchQuery, setSearchQuery] = useState<string | null>(null);
    const [lastSearchedQuery, setLastSearchedQuery] = useState<string | null>(null); 
    const searchBarRef = useRef<{ clearInput: () => void } | null>(null);

    const handleOnTrackAdd = (track: Track) => {
        onTrackAdd(track);
        searchBarRef.current?.clearInput();  
    }

    const getTrackId = (item: Track) => item.id;
    const renderTrackItem = (track: Track) => {
        return <TrackItem key={track.id} track={track} onTrackAdd={handleOnTrackAdd}/>;
    };

    const { data: tracks, isLoading, refetch } = useQuery({
        queryKey: ['tracks-result', searchQuery],
        queryFn: () => searchTracks(searchQuery),
        enabled: false
    })

    const handleSearchTrigger = useCallback(() => {
        // Prevent redundant search
        if (searchQuery && searchQuery !== lastSearchedQuery) 
        { 
            setLastSearchedQuery(searchQuery); 
            refetch();
        }
    }, [searchQuery, lastSearchedQuery, refetch]);

    return (
        <div>
            <SearchBar
                ref={searchBarRef}
                onSearchQueryChange={setSearchQuery}
                onSearchTrigger={handleSearchTrigger}
                isLoading={isLoading}
                placeholderText="Search tracks"
            />
            {
                tracks && tracks.length > 0 &&
                <div className="mt-6">
                    <ItemList items={tracks} renderItem={renderTrackItem} getId={getTrackId}/>
                </div>
            }
        </div>
    )
}

