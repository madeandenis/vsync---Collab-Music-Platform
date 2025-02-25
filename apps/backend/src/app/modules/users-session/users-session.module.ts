import { Module } from '@nestjs/common';
import { UsersSessionService } from './users-session.service';
import { UsersSessionController } from './users-session.controller';

@Module({
  controllers: [UsersSessionController],
  providers: [UsersSessionService],
  exports: [UsersSessionService]
})
export class UsersSessionModule {}
