import { GroupSession, ScoredTrack } from "@frontend/shared";
import { useQuery } from "@tanstack/react-query";
import { fetchAccessToken } from "../_api/spotifyApi";
import { useState, useMemo } from "react";
import { Playback } from "../_types/playback.types";
import { useSpotifyPlayerActions } from "./spotify/useSpotifyPlayerActions";
import useSpotifyPlayer from "./spotify/useSpotifyPlayer";
import { GroupSocketActions } from "./group/useGroupSocket";
import useAutoPlayNext from "./useAutoPlayNext";
import useAutoRotateQueue from "./useAutoRotateQueue";
import { useVolumePersistence } from "./useVolumePersistence";

export interface PlaybackContext {
  states: {
    isSdkReady: boolean;
    sdkPlayer: Playback.Player | null;
    player: Playback.Player | null;
    state: Playback.State | null;
    deviceId: string | null;
    error: string | null;
    repeatMode: 'on' | 'off';
  };
  setters: {
    setIsSdkReady: React.Dispatch<React.SetStateAction<boolean>>;
    setSdkPlayer: React.Dispatch<React.SetStateAction<Playback.Player | null>>;
    setPlayer: React.Dispatch<React.SetStateAction<Playback.Player | null>>;
    setState: React.Dispatch<React.SetStateAction<Playback.State | null>>;
    setDeviceId: React.Dispatch<React.SetStateAction<string | null>>;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    setRepeatMode: React.Dispatch<React.SetStateAction<"on" | "off">>;
  };
}

export default function usePlayback(
  queue: ScoredTrack[],
  syncQueue: (newQueue: ScoredTrack[]) => void,
  nowPlaying: GroupSession['nowPlaying'] | undefined,
  platform: GroupSession['platform'] | undefined,
  socketActions: GroupSocketActions
): PlaybackContext {

  const [sdkPlayer, setSdkPlayer] = useState<any | null>(null);
  const [isSdkReady, setIsSdkReady] = useState<boolean>(false);
  const [state, setState] = useState<Playback.State | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [repeatMode, setRepeatMode] = useState<'on' | 'off'>('off');

  const { volume } = useVolumePersistence();

  const states = {
    isSdkReady,
    sdkPlayer,
    player: null,
    state,
    deviceId,
    error,
    repeatMode,
  };
  const setters = {
    setIsSdkReady,
    setSdkPlayer,
    setPlayer: setSdkPlayer,
    setState,
    setDeviceId,
    setError,
    setRepeatMode,
  };
  const context: PlaybackContext = { states, setters };

  const { data: accessToken } = useQuery({
    queryKey: ["spotifyAccessToken"],
    queryFn: fetchAccessToken,
    enabled: platform === "Spotify",
  });

  useSpotifyPlayer(context, accessToken, volume);
  const playerActions = useSpotifyPlayerActions(
    context,
    nowPlaying,
    queue,
    socketActions.playback,
    accessToken,
  );
  
  useAutoPlayNext(platform, sdkPlayer, playerActions.nextTrack);
  useAutoRotateQueue(state, queue, syncQueue);

  const appPlayer: Playback.Player | null = useMemo(() => {
    if (!sdkPlayer || !isSdkReady) return null;

    if (platform === 'Spotify') {
      return {
        ...playerActions,
        getCurrentState: async (): Promise<Playback.State | null> => {
          const rawState = await sdkPlayer.getCurrentState();
          return rawState
            ? Playback.Adapter.state.fromSpotify(rawState, repeatMode)
            : null;
        },
        setName: sdkPlayer.setName.bind(sdkPlayer),
        getVolume: sdkPlayer.getVolume.bind(sdkPlayer),
        setVolume: sdkPlayer.setVolume.bind(sdkPlayer),
        setRepeatMode: setRepeatMode,
      };
    } else {
      return null;
    }
  }, [sdkPlayer, playerActions]);

  return {
    states: {
      ...states,
      player: appPlayer,
    },
    setters,
  };
}
