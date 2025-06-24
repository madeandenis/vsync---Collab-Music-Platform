import { useCallback, useEffect, useState } from "react";
import { Spotify } from "../_types/spotify";
import { APP_NAME } from "../_constants/appConfig";
import { useVolumeControl } from "./useVolumeControl";

export function useSpotifyPlayer(accessToken: string | undefined) {
    const [player, setPlayer] = useState<Spotify.Player | null>(null);
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [state, setPlaybackState] = useState<Spotify.PlaybackState | null>(null);
    const { volume } = useVolumeControl();

    const formatError = useCallback((type: string, message: string) => {
        return `[${type}] ${message}`;
    }, []);

    useEffect(() => {
        if (error && error.includes('premium users') && !error.includes('spotify premium users')) {
            setError(error.replace('premium users', 'spotify premium users'));
        }
    }, [error]);

    // Initialize Spotify player when access token is available
    useEffect(() => {
        if (!accessToken) return;

        // Create and append Spotify SDK script
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);

        // Setup player when SDK is ready
        window.onSpotifyWebPlaybackSDKReady = () => {
            const spotifyPlayer = new window.Spotify.Player({
                name: APP_NAME,
                getOAuthToken: callback => callback(accessToken),
                volume,
            });

            spotifyPlayer.addListener('ready', ({ device_id }) => {
                setDeviceId(device_id);
                setIsPlayerReady(true);
            });

            spotifyPlayer.addListener('not_ready', () => {
                setIsPlayerReady(false);
            });

            spotifyPlayer.addListener('initialization_error', ({ message }) => {
                setError(formatError('initialization', message));
            });

            spotifyPlayer.addListener('authentication_error', ({ message }) => {
                setError(formatError('authentication', message));
            });

            spotifyPlayer.addListener('account_error', ({ message }) => {
                setError(formatError('account', message));
            });

            spotifyPlayer.addListener('playback_error', ({ message }) => {
                setError(formatError('playback', message));
            });

            spotifyPlayer.addListener('player_state_changed', (state) => {
                setPlaybackState(state);
            });

            spotifyPlayer.connect();
            setPlayer(spotifyPlayer);
        };

        return () => {
            if (player) {
                player.disconnect();
            }
            document.body.removeChild(script);
        };
    }, [accessToken]);

    return { player, state, deviceId, isPlayerReady, error };
}