import { useEffect, useState } from "react";
import { Spotify } from "../_types/spotify";
import { APP_NAME } from "../_constants/appConfig";

interface SpotifyPlaybackHook {
  player: Spotify.Player | null;
  deviceId: string | null;
  isReady: boolean;
  error: string | null;
  currentState: Spotify.PlaybackState | null;
}

export function useSpotifyPlayback(accessToken: string | undefined): SpotifyPlaybackHook {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentState, setCurrentState] = useState<Spotify.PlaybackState | null>(null);

  useEffect(() => {
    if (error && error.includes('premium users') && !error.includes('spotify premium users')) {
      setError(error.replace('premium users', 'spotify premium users'));
    }
  }, [error]);

  useEffect(() => {
    if (accessToken) {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);

      window.onSpotifyWebPlaybackSDKReady = () => {
        const spotifyPlayer = new window.Spotify.Player({
          name: APP_NAME,
          getOAuthToken: cb => cb(accessToken),
          volume: 0.5
        });

        spotifyPlayer.addListener('ready', ({ device_id }) => {
          setDeviceId(device_id);
          setIsReady(true);
        });

        spotifyPlayer.addListener('not_ready', ({ device_id }) => {
          setIsReady(false);
        });

        spotifyPlayer.addListener('player_state_changed', (state) => {
          setCurrentState(state);
        });

        spotifyPlayer.addListener('initialization_error', ({ message }) => {
          setError(message);
        });

        spotifyPlayer.addListener('authentication_error', ({ message }) => {
          setError(message);
        });

        spotifyPlayer.addListener('account_error', ({ message }) => {
          setError(message);
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
    }
  }, [accessToken]);

  return { player, deviceId, isReady, error, currentState };
}  