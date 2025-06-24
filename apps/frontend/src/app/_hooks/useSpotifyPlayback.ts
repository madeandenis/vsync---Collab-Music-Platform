import { ScoredTrack } from "@frontend/shared";
import { PlaybackEventEmitters, usePlaybackControls } from "./useSpotifyPlaybackControls";
import { Spotify } from "../_types/spotify";
import { useSpotifyPlayer } from "./useSpotifyPlayer";
import { useQuery } from "@tanstack/react-query";
import { fetchAccessToken } from "../_api/spotifyApi";
import { useQueueControls } from "./useQueueControls";

export interface PlayerState {
  player: Spotify.Player | null;
  state: Spotify.PlaybackState | null;
  isPlayerReady: boolean;
  isRepeatOn: boolean;
  error: string | null;
}

export interface PlaybackControls {
  play: (trackId?: string) => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  pausePlayback: () => Promise<void>;
  resumePlayback: () => Promise<void>;
  seek: (position_ms: number) => Promise<void>;
  setRepeatMode: (shouldRepeat: boolean) => void;
} 

interface SpotifyPlaybackHook {
  playerState: PlayerState,
  playbackControls: PlaybackControls,
}

export function useSpotifyPlayback(
  queue: ScoredTrack[],
  setQueue: (updatedQueue: ScoredTrack[]) => void,
  emitters: PlaybackEventEmitters
): SpotifyPlaybackHook {
  
  const { data: accessToken } = useQuery({
    queryKey: ["spotifyAccessToken"],
    queryFn: fetchAccessToken,
  });

  const { player, state, deviceId, isPlayerReady, error } = useSpotifyPlayer(accessToken);
  const { isRepeatOn, setRepeatMode } = useQueueControls(queue, setQueue, state);
  const controls = usePlaybackControls(player, isPlayerReady, deviceId, accessToken, emitters, state, queue);

  return {
    playerState: {
      player,
      state,
      error,
      isPlayerReady,
      isRepeatOn,
    },
    playbackControls: {
      ...controls,
      setRepeatMode,
    }
  };
}