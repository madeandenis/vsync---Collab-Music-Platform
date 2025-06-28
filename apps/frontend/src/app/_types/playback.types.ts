import { Spotify } from "./spotify";

export namespace Playback {

  export interface Player {
    getCurrentState(): Promise<State | null>;
    setName(name: string): Promise<void>;
    getVolume(): Promise<number>;
    setVolume(volume: number): Promise<void>;
    play(trackId?: string, positionMs?: number, syncMode?: boolean): Promise<void>;
    pause(syncMode?: boolean): Promise<void>;
    resume(syncMode?: boolean): Promise<void>;
    togglePlay(syncMode?: boolean): Promise<void>;
    seek(position_ms: number, syncMode?: boolean): Promise<void>;
    previousTrack(syncMode?: boolean): Promise<void>;
    nextTrack(syncMode?: boolean): Promise<void>;
    setRepeatMode(repeatMode: 'off' | 'on'): void;
  }

  export interface State extends Spotify.PlaybackState {
    repeatMode: 'off' | 'on';
  }
  export interface Track extends Spotify.WebPlaybackTrack { }

  export const Adapter = {
    state: {
      fromSpotify(spotifyState: Spotify.PlaybackState | null, repeatMode: 'off' | 'on' = 'off'): Playback.State | null {
        if (!spotifyState) return null;

        return {
          ...spotifyState,
          repeatMode
        };
      },

      toSpotify(playbackState: Playback.State | null): Spotify.PlaybackState | null {
        if (!playbackState) return null;
        return {
          ...playbackState,
        };
      },
    },
  }

};


