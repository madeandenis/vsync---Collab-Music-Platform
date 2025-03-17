import { QueuedTrack, ScoredTrack } from "@frontend/shared";
import { CacheService } from "./cache.service";

export class TrackQueueService extends CacheService<unknown>
{
    protected prefix = 'track:queue';
    private key = (groupId) => `${this.prefix}:${groupId}`;

    async addTrack(groupId: string, scoredTrack: ScoredTrack): Promise<void>
    {
        const serializedTrack = JSON.stringify(scoredTrack.queuedTrack);

        await this.client.zadd(
            this.key(groupId), 
            scoredTrack.score,
            serializedTrack
        );
    }

    // From high to low
    async getQueue(groupId: string): Promise<ScoredTrack[]>
    {
        const tracksSerialized = await this.client.zrevrange(
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

    async updateQueue(groupId: string, queue: ScoredTrack[]): Promise<void>
    {
        const key = this.key(groupId);

        // redis transaction
        const multi = this.client.multi();

        multi.del(key);

        for (const track of queue) {
            const serializedTrack = JSON.stringify(track.queuedTrack);
            multi.zadd(key, track.score, serializedTrack);
        }

        await multi.exec();
    }

    async removeTrack(groupId: string, queuedTrack: QueuedTrack): Promise<void>
    {
        const serializedTrack = JSON.stringify(queuedTrack); 
        await this.client.zrem(
            this.key(groupId),
            serializedTrack
        );
    }

    async voteTrack(groupId: string, queuedTrack: QueuedTrack, voteWeight: number): Promise<void>
    {
        const serializedTrack = JSON.stringify(queuedTrack); 
        await this.client.zincrby(
            this.key(groupId),
            voteWeight,
            serializedTrack
        );
    }

}