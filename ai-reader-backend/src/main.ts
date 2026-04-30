import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const globalPrefix = 'api';
  const port = Number(process.env.PORT ?? 3001);
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const allowedDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;
      if (allowedDevOrigin.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.setGlobalPrefix(globalPrefix);
  await app.listen(port);

  const appUrl = await app.getUrl();
  logger.log(`Server listening on: ${appUrl}`);
  logger.log(`Global route prefix: /${globalPrefix}`);
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  const errorMessage =
    error instanceof Error ? (error.stack ?? error.message) : String(error);
  logger.error('Failed to bootstrap Nest application', errorMessage);
  process.exit(1);
});
