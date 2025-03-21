declare global {
    interface Window {
      Spotify: {
        Player: new (options: Spotify.PlayerOptions) => Spotify.Player;
      };
      onSpotifyWebPlaybackSDKReady: () => void;
    }
  }
declare namespace Spotify {
    interface PlayerOptions {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
    }

    interface Player {
        connect(): Promise<boolean>;
        disconnect(): void;
        addListener(event: 'ready', callback: (({ device_id }: { device_id: string }) => void)): void;
        addListener(event: 'not_ready', callback: (({ device_id }: { device_id: string }) => void)): void;
        addListener(event: 'player_state_changed', callback: ((state: PlaybackState) => void)): void;
        addListener(event: 'initialization_error', callback: ((error: Error) => void)): void;
        addListener(event: 'authentication_error', callback: ((error: Error) => void)): void;
        addListener(event: 'account_error', callback: ((error: Error) => void)): void;
        addListener(event: 'playback_error', callback: ((error: Error) => void)): void;
        removeListener(event: string, callback?: Function): void;
        getCurrentState(): Promise<PlaybackState | null>;
        setName(name: string): Promise<void>;
        getVolume(): Promise<number>;
        setVolume(volume: number): Promise<void>;
        pause(): Promise<void>;
        resume(): Promise<void>;
        togglePlay(): Promise<void>;
        seek(position_ms: number): Promise<void>;
        previousTrack(): Promise<void>;
        nextTrack(): Promise<void>;
    }

    interface PlaybackState {
        context: {
            uri: string;
            metadata: any;
        };
        disallows: {
            pausing: boolean;
            peeking_next: boolean;
            peeking_prev: boolean;
            resuming: boolean;
            seeking: boolean;
            skipping_next: boolean;
            skipping_prev: boolean;
        };
        paused: boolean;
        position: number;
        duration: number;
        repeat_mode: number;
        shuffle: boolean;
        track_window: {
            current_track: WebPlaybackTrack;
            previous_tracks: WebPlaybackTrack[];
            next_tracks: WebPlaybackTrack[];
        };
    }

    interface WebPlaybackTrack {
        uri: string;
        id: string;
        type: 'track' | 'episode' | 'ad';
        media_type: 'audio' | 'video';
        name: string;
        is_playable: boolean;
        album: {
            uri: string;
            name: string;
            images: { url: string }[];
        };
        artists: {
            uri: string;
            name: string;
        }[];
    }
    
}

export { Spotify };