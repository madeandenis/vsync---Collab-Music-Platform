import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { Spotify } from "../_types/spotify";
import { APP_NAME } from "../_constants/appConfig";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchAccessToken, PlaybackRequest, startPlaybackOnDevice } from "../_api/spotifyApi";
import { ScoredTrack, Track } from "@frontend/shared";
import { useAlertContext } from "../contexts/alertContext";

function trackToUri(track: Track): string {
  return `spotify:track:${track.id}`;
}

function queueToUris(queue: ScoredTrack[]): string[] {
  return queue.map((scoredTrack) => trackToUri(scoredTrack.queuedTrack.trackDetails));
}

export interface SpotifyPlaybackHook {
  player: Spotify.Player | null;
  deviceId: string | null;
  isPlayerReady: boolean;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  state: Spotify.PlaybackState | null;
  playQueue: (queue:ScoredTrack[], offset?: number, position_ms?: number) => void;
  playTrack: (queue: ScoredTrack[], trackId: string, offset?: number, position_ms?: number) => void;
}

export function useSpotifyPlayback(): SpotifyPlaybackHook {
  const [player, setSpotifyPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setPlaybackDeviceId] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setPlaybackState] = useState<Spotify.PlaybackState | null>(null);

  const alertContext = useAlertContext();

  // Remove after
  useEffect(() => {
    if (error) {
      alertContext.setAlert(error, 'error');
    }
  }, [error])

  const { data: accessToken } = useQuery({
    queryKey: ["spotifyAccessToken"],
    queryFn: fetchAccessToken,
  });

  useEffect(() => {
    if (error && error.includes('premium users') && !error.includes('spotify premium users')) {
      setError(error.replace('premium users', 'spotify premium users'));
    }
  }, [error]);

  useEffect(() => {
    if (!accessToken) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: APP_NAME,
        getOAuthToken: callback => callback(accessToken),
        volume: 0.5
      });

      player.addListener('ready', ({ device_id }) => {
        setPlaybackDeviceId(device_id);
        setIsPlayerReady(true);
      });

      player.addListener('not_ready', ({ device_id }) => {
        setIsPlayerReady(false);
      });

      player.addListener('player_state_changed', (state) => {
        setPlaybackState(state);
      });

      player.addListener('initialization_error', ({ message }) => {
        setError(message);
      });

      player.addListener('authentication_error', ({ message }) => {
        setError(message);
      });

      player.addListener('playback_error', ({ message }) => {
        setError(message);
      });

      player.addListener('account_error', ({ message }) => {
        setError(message);
      });

      player.connect();
      setSpotifyPlayer(player);
    };

    return () => {
      if (player) {
        player.disconnect();
      }
      document.body.removeChild(script);
    };
  }, [accessToken]);

  const playbackMutation = useMutation({
    mutationFn: (request: PlaybackRequest) => startPlaybackOnDevice(request),
    onError: (error) => setError(error.message),
  });

  const mutatePlayback = useCallback((request: PlaybackRequest) => {
    playbackMutation.mutate(request);
  }, [playbackMutation]);


  const playQueue = useCallback((queue: ScoredTrack[], offset?: number, position_ms?: number) => {
    if (!accessToken || !isPlayerReady || !player || !deviceId) {
      return;
    }

    const uris = queueToUris(queue);

    mutatePlayback({
      accessToken,
      deviceId: deviceId,
      playback: {
        uris,
        offset: { position: offset ?? 0 },
        position_ms: position_ms ?? 0
      },
    });
  }, [accessToken, isPlayerReady, player, deviceId]);

  const playTrack = useCallback((queue: ScoredTrack[], trackId: string, offset?: number, position_ms?: number) => {
    if (!accessToken || !isPlayerReady || !player || !deviceId) {
      return;
    }

    const trackIndex = queue.findIndex(track => track.queuedTrack.trackDetails.id === trackId);
    if (trackIndex === -1) {
      alert("Track not found in queue!");
      return;
    }

    const [track] = queue.splice(trackIndex, 1);
    queue.unshift(track);

    const uris = queueToUris(queue);

    mutatePlayback({
      accessToken,
      deviceId: deviceId,
      playback: {
        uris,
        offset: { position: offset ?? 0 },
        position_ms: position_ms ?? 0
      },
    });
  }, [accessToken, isPlayerReady, player, deviceId]);

  return {
    player,
    deviceId,
    isPlayerReady,
    error,
    setError,
    state,
    playQueue,
    playTrack
  };
}