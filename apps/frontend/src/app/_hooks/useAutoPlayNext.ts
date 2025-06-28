import { GroupSession } from '@frontend/shared';
import { Playback } from '../_types/playback.types';
import { useEffect, useRef } from 'react';
import { Spotify } from '../_types/spotify';

export default function useAutoPlayNext(
    platform?: GroupSession['platform'],
    sdkPlayer?: any,
    nextTrack?: () => Promise<void>
) {
    const previousStateRef = useRef<Playback.State | null>(null);

    useEffect(() => {
        if (!platform || !sdkPlayer || !nextTrack) return;

        if (platform === 'Spotify') {
            const handleStateChange = (state: Spotify.PlaybackState) => {
                if (!state) return;

                const prevState = previousStateRef.current;
                const wasPlaying = prevState?.paused === false;
                const stoppedAtStart = state.paused && state.position === 0;

                if (wasPlaying && stoppedAtStart) {
                    nextTrack();
                }

                previousStateRef.current = Playback.Adapter.state.fromSpotify(state);
            };

            sdkPlayer.addListener('player_state_changed', handleStateChange);

            return () => {
                sdkPlayer.removeListener('player_state_changed', handleStateChange);
            };
        } else {
            return;
        }
    }, [platform, sdkPlayer, nextTrack]);
}
