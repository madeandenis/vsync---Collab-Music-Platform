import { Module } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { SpotifyController } from './spotify.controller';
import { AuthModule } from '../../auth/auth.module';
import { AccountsModule } from '../../accounts/accounts.module';
import { UsersSessionModule } from '../../users-session/users-session.module';

@Module({
  imports: [
    AuthModule,
    AccountsModule,
    UsersSessionModule,
  ],
  controllers: [SpotifyController],
  providers: [SpotifyService],
  exports: [SpotifyService],
})
export class SpotifyModule {}
