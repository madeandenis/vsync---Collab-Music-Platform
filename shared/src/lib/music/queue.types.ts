import { Track } from "./music-service.types";

export interface QueuedTrack
{
    trackDetails: Track,
    addedBy: { sessionId: string, username?: string };
    addedAt: string;
}

export interface ScoredTrack
{
    queuedTrack: QueuedTrack,
    score: number
}