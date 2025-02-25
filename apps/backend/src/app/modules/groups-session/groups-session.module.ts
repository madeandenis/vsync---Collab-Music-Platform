import { Module } from '@nestjs/common';
import { GroupsSesionService } from './groups-session.service';
import { GroupsSesionController } from './groups-session.controller';
import { CacheModule } from '../cache/cache.module';
import { GroupsModule } from '../groups/groups.module';

@Module({
  imports: [
    GroupsModule, // required by GroupOwnershipGuard
    CacheModule
  ],
  controllers: [GroupsSesionController],
  providers: [GroupsSesionService],
  exports: [GroupsSesionService],
})
export class GroupsSesionModule {}
