import { useEffect } from "react";
import { Spotify } from "../../_types/spotify";
import { APP_NAME } from "../../_constants/appConfig";
import { PlaybackContext } from "../usePlayback";
import { Playback } from "../../_types/playback.types";
import { GroupSession } from "@frontend/shared";

export default function useSpotifyPlayer(
    context: PlaybackContext,
    accessToken: string | undefined,
    initialVolume: number 
) {
    const { repeatMode } = context['states'];
    const { setIsSdkReady, setPlayer, setDeviceId, setError, setState } = context['setters'];

    useEffect(() => {
        if (!accessToken) return;

        let spotifyScript: HTMLScriptElement | null = null;
        let spotifyPlayerInstance: Spotify.Player | null = null;

        async function initializePlayer(token: string) {
            try {
                // Check if Spotify is actually available
                if (!(window as any).Spotify || !(window as any).Spotify.Player) {
                    console.error('Spotify SDK not available');
                    return;
                }

                const spotifyPlayer = new (window as any).Spotify.Player({
                    name: APP_NAME,
                    getOAuthToken: (cb: (token: string) => void) => cb(token),
                    volume: initialVolume
                });

                spotifyPlayer.addListener('ready', ({ device_id }: any) => {
                    setIsSdkReady(true);
                    setDeviceId(device_id);
                });
                spotifyPlayer.addListener('not_ready', ({ device_id }: any) => {
                    setIsSdkReady(false);
                });


                // Add error listeners before connecting
                spotifyPlayer.addListener('initialization_error', ({ message }: any) => {
                    setError(`[initialization' ${message}`);
                });

                spotifyPlayer.addListener('authentication_error', ({ message }: any) => {
                    setError(`[authentication_error] ${message}`);
                });

                spotifyPlayer.addListener('account_error', ({ message }: any) => {
                    const finalMessage =
                        message.includes('premium users') && !message.includes('spotify premium users')
                            ? message.replace('premium users', 'spotify premium users')
                            : message;

                    setError(`[account_error] ${finalMessage}`);
                });

                spotifyPlayer.addListener('playback_error', ({ message }: any) => {
                    setError(`[playback_error] ${message}`);
                });

                spotifyPlayer.addListener('player_state_changed', (state: Spotify.PlaybackState) => {
                    if(!state) return;

                    setState(Playback.Adapter.state.fromSpotify(state, repeatMode));
                });

                const connected = await spotifyPlayer.connect();

                if (connected) {
                    setPlayer(spotifyPlayer);
                    spotifyPlayerInstance = spotifyPlayer;
                } else {
                    console.error("Spotify Player connection failed");
                }
            } catch (error) {
                console.error('Error initializing Spotify player:', error);
            }
        }

        // Check if SDK is already loaded
        if ((window as any).Spotify) {
            initializePlayer(accessToken);
        } else {
            // Check if script is already in DOM
            const existingScript = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]');
            if (existingScript) {
                // Wait for SDK to be ready
                if (!(window as any).onSpotifyWebPlaybackSDKReady) {
                    (window as any).onSpotifyWebPlaybackSDKReady = () => {
                        initializePlayer(accessToken);
                    };
                }
            } else {
                // Create and append Spotify SDK script
                spotifyScript = document.createElement("script");
                spotifyScript.src = "https://sdk.scdn.co/spotify-player.js";
                spotifyScript.async = true;

                spotifyScript.onerror = (error) => {
                    console.error('Failed to load Spotify SDK script:', error);
                };

                document.body.appendChild(spotifyScript);

                (window as any).onSpotifyWebPlaybackSDKReady = () => {
                    initializePlayer(accessToken);
                };
            }
        }

        return () => {
            if (spotifyPlayerInstance) {
                spotifyPlayerInstance.disconnect();
            }
            if (spotifyScript && document.body.contains(spotifyScript)) {
                document.body.removeChild(spotifyScript);
            }
        };
    }, [accessToken]);
}