import { Module } from '@nestjs/common';
import { UsersProfileService } from './users-profile.service';
import { UsersProfileController } from './users-profile.controller';

@Module({
  controllers: [UsersProfileController],
  providers: [UsersProfileService],
})
export class UsersProfileModule {}
