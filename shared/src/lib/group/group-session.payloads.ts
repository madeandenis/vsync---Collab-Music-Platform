import { Track } from "../music/music-service.types";

export type TrackStateChangePayload = {
    trackId: string;
    progressMs: number;
    clientUpdatedAt: string;
};

export type SeekPayload = {
    trackId: string;
    seekPosition: number;
    clientUpdatedAt: string;
};

export type AddTrackPayload = {
    track: Track;
    score: number;
};
  