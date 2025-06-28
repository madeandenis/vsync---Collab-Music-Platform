import { useEffect } from "react";
import { GroupSession } from "@frontend/shared";
import { Playback } from "../_types/playback.types";

export default function usePlaybackSync(
    nowPlaying: GroupSession['nowPlaying'] | null,
    playbackState: Playback.State | null,
    player: Playback.Player | null
) {
    useEffect(() => {
        const syncPlayback = async () => {
            if (!player || !nowPlaying) return;

            const playbackTrack = playbackState?.track_window?.current_track;
            const sessionTrack = nowPlaying.track;
            const isSessionPaused = nowPlaying.state === 'paused';
            const sessionPosition = nowPlaying.progressMs ?? 0;
            const currentPosition = playbackState?.position ?? 0;
            const positionMismatch = Math.abs(currentPosition - sessionPosition);
            const positionThreshold = 500;

            if (
                !playbackState ||
                !playbackTrack ||
                playbackTrack.id !== sessionTrack.id
            ) {
                await player.play(sessionTrack.id, 0, true);
                return;
            }

            if (positionMismatch > positionThreshold) {
                await player.seek(sessionPosition, false);
            }

            if (playbackState.paused !== isSessionPaused) {
                await player.togglePlay(true);
            }
        };

        syncPlayback();
    }, [nowPlaying]);
}
