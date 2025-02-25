import { Module } from '@nestjs/common';
import { CacheService } from './services/cache.service';
import { TrackQueueService } from './services/track-queue.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { GroupsSessionCache } from './services/groups-session-cache.service';
import { UsersSessionCache } from './services/users-session-cache.service';

@Module({
  imports: [RedisModule], 
  providers: [
    CacheService,
    GroupsSessionCache,
    UsersSessionCache,
    TrackQueueService
  ],
  exports: [
    CacheService,
    GroupsSessionCache,
    UsersSessionCache,
    TrackQueueService
  ],
})
export class CacheModule {}
