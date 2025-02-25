import { Track } from "@frontend/shared";
import { CacheService } from "./cache.service";

export interface QueuedTrack
{
    trackDetails: Track,
    addedBy: { sessionId: string, username?: string };
    addedAt: string;
}

export interface ScoredTrack
{
    queuedTrack: QueuedTrack,
    score?: number
}

export class TrackQueueService extends CacheService<unknown>
{
    protected prefix = 'track:queue';
    private key = (groupId) => `${this.prefix}:${groupId}`;

    async addTrack(groupId: string, scoredTrack: ScoredTrack)
    {
        const serializedTrack = JSON.stringify(scoredTrack.queuedTrack); 
        await this.client.zadd(
            this.key(groupId),  
            scoredTrack.score,
            serializedTrack
        )
    }

    async getScore(groupId: string, queuedTrack: QueuedTrack)
    {
        const serializedTrack = JSON.stringify(queuedTrack);
        const score = await this.client.zscore(
            this.key(groupId),  
            serializedTrack
        )
        return score !== null && score !== undefined ? parseFloat(score) : null;
    }

    async getQueue(groupId: string): Promise<ScoredTrack[]>
    {
        const tracksSerialized = await this.client.zrange(
            this.key(groupId),  
            0,  // start index
            -1, // end index
            'WITHSCORES'
        );
        const scoredTracks: ScoredTrack[] = [];

        for (let i = 0; i < tracksSerialized.length; i += 2) {
            const queuedTrack = JSON.parse(tracksSerialized[i]); 
            const score = parseFloat(tracksSerialized[i + 1]); 
            scoredTracks.push({
                queuedTrack,
                score
            })            
        }

        return scoredTracks;
    }

    async removeTrack(groupId: string, queuedTrack: QueuedTrack)
    {
        const serializedTrack = JSON.stringify(queuedTrack); 
        await this.client.zrem(
            this.key(groupId),
            serializedTrack
        );
    }

    async voteTrack(groupId: string, queuedTrack: QueuedTrack, voteWeight: number)
    {
        const serializedTrack = JSON.stringify(queuedTrack); 
        await this.client.zincrby(
            this.key(groupId),
            voteWeight,
            serializedTrack
        );
    }

}