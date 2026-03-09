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
  app.enableCors();
  app.setGlobalPrefix(globalPrefix);
  await app.listen(port);

  const appUrl = await app.getUrl();
  logger.log(`Server listening on: ${appUrl}`);
  logger.log(`Global route prefix: /${globalPrefix}`);
}
bootstrap();
