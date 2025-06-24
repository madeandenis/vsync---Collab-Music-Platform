import { ScoredTrack } from "@frontend/shared";
import { Spotify } from "../_types/spotify";
import { useCallback, useState } from "react";

export function useQueueControls(
    queue: ScoredTrack[],
    setQueue: (updatedQueue: ScoredTrack[]) => void,
    state: Spotify.PlaybackState | null
) {
    const [isRepeatOn, setIsRepeatOn] = useState(false);

    /**
     * Sets the repeat mode and modifies the queue based on the repeat setting
     * When repeat is on, current track moves to the top of the queue
     * When repeat is off, current track moves to the end of the queue
     * 
     * @param shouldRepeat - Whether repeat mode should be enabled
     */
    const setRepeatMode = useCallback((shouldRepeat: boolean): void => {
        // Update local repeat state
        setIsRepeatOn(shouldRepeat);

        // Get the current track from playback state
        const currentTrack = state?.track_window.current_track;
        if (!currentTrack || !queue.length) return;

        // Find the index of the current track in the queue
        const currentIndex = queue.findIndex(
            (t) => t.queuedTrack.trackDetails.id === currentTrack.id
        );
        if (currentIndex === -1) return;

        const newQueue = [...queue];

        if (shouldRepeat) {
            // Move the current track to the front if it's not already
            if (currentIndex > 0) {
                [newQueue[0], newQueue[currentIndex]] = [newQueue[currentIndex], newQueue[0]];
            }
        } else {
            // Move the current track to the end if it's at the front
            if (currentIndex === 0 && queue.length > 1) {
                [newQueue[queue.length - 1], newQueue[currentIndex]] = [
                    newQueue[currentIndex],
                    newQueue[queue.length - 1],
                ];
            }
        }

        // Only update queue if changes were made to prevent unnecessary re-renders
        if (JSON.stringify(newQueue) !== JSON.stringify(queue)) {
            setQueue(newQueue);
        }
    }, [state?.track_window.current_track, queue, setQueue]);


    return { setRepeatMode, isRepeatOn };
}