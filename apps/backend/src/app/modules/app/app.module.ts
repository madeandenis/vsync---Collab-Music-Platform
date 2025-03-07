import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as Joi from 'joi';
import { SpotifyModule } from '../third-party/spotify/spotify.module';
import { AuthModule } from '../auth/auth.module';
import { RedisModule, RedisModuleOptions } from '@nestjs-modules/ioredis';
import { WebsocketsModule } from '../gateways/websockets.module';
import { GroupsModule } from '../groups/groups.module';
import { GroupsSesionModule } from '../groups-session/groups-session.module';
import { UsersModule } from '../users/users.module';
import { UsersProfileModule } from '../users-profile/users-profile.module';
import { UsersSessionModule } from '../users-session/users-session.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from '../../common/interceptors/log.interceptor';

@Module({
  imports: [
    SpotifyModule,
    AuthModule,
    WebsocketsModule,
    GroupsModule,
    GroupsSesionModule,
    UsersModule,
    UsersSessionModule,
    UsersProfileModule,
    ConfigModule.forRoot({
      isGlobal: true, 
      validationSchema: Joi.object({
        // Spotify API Credentials
        SPOTIFY_CLIENT_ID: Joi.string().required(),
        SPOTIFY_CLIENT_SECRET: Joi.string().required(),
        SPOTIFY_REDIRECT_URI: Joi.string().required(),

        // Redis Configuration
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),

        // Session Configuration
        COOKIE_SECRET: Joi.string().required(),

        // Environment & Server Config
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        HOST: Joi.string().default('localhost'),
        API_PORT: Joi.number(),
        CLIENT_PORT: Joi.number(),
      }),
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      
      useFactory: async (configService: ConfigService): Promise<RedisModuleOptions> => {
        const redisHost = configService.get<string>('REDIS_HOST');
        const redisPort = configService.get<string>('REDIS_PORT');
        const redisUrl = `redis://${redisHost}:${redisPort}`;
        return { 
          type: 'single',
          url: redisUrl
        };
      }
    }),
    // TODO - Implement ThrottlerModule & ThrottlerExceptionFilter
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
