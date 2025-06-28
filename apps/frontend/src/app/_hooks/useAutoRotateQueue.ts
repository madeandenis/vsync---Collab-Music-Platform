import { ScoredTrack } from "@frontend/shared";
import { useEffect } from "react";
import { Playback } from "../_types/playback.types";
import { rotateQueueForward } from "../_utils/queueUtils";

export default function autoRotateQueue(
    playbackState: Playback.State | null,
    queue: ScoredTrack[],
    setQueue: (newQueue: ScoredTrack[]) => void,
) {
    useEffect(() => {
        if (!queue.length) return;

        const playbackTrack = playbackState?.track_window.current_track;
        const leadQueueTrack = queue[0]; 

        if (!playbackTrack) return;

        if (playbackTrack.id === leadQueueTrack.queuedTrack.trackDetails.id) 
        {
            const rotated = rotateQueueForward(queue);
            setQueue(rotated);
        }
    
    }, [queue, setQueue]);
};
