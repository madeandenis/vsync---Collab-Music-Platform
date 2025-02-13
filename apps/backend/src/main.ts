import { INestApplication, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/modules/app/app.module';
import { createLogger } from './app/common/utils/logger.util';
import bodyParser from 'body-parser';
import { ConfigService } from '@nestjs/config';
import expressListRoutes from 'express-list-routes';

import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const logger = createLogger("main.ts");

function configureParsers(app: INestApplication)
{
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
}

function displayRoutes(app: INestApplication, baseUrl: string)
{
  const expressApp = app.getHttpAdapter().getInstance();
  const routes = expressListRoutes(expressApp); 

  const formattedRoutes = routes.map(route => `${baseUrl}${route.path}`);

  console.log('Available Routes:');
  formattedRoutes.forEach(route => console.log(route)); 
}

async function initializeRedisClient()
{
  const redisClient = createClient();

  redisClient.on('error', (err) => {
    logger.error('Redis connection error', err);
  });

  await redisClient.connect();
  return redisClient;
}

function configureSessionMiddleware(redisClient) 
{
  return session({
    store: new RedisStore({ client: redisClient }),
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60, 
    },
  });
}


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const host = configService.get<number>('HOST');
  const port = configService.get<number>('API_PORT');
  const nodeEnvironment = configService.get<string>('NODE_ENV');
  const secure = nodeEnvironment === 'production';
  const baseUrl = `${secure ? 'https' : 'http'}://${host}:${port}`;

  app.setGlobalPrefix('api');
  configureParsers(app);

  const redisClient = await initializeRedisClient();

  app.use(configureSessionMiddleware(redisClient));

  await app.listen(port);
  logger.info(`Application is running on: ${baseUrl}`);

  displayRoutes(app, baseUrl);
}

bootstrap();
