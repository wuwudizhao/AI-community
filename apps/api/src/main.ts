import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { API_LISTEN_HOST, resolveApiPort } from './server-config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = resolveApiPort(config);
  const webOrigin = config.getOrThrow<string>('WEB_ORIGIN');

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableCors({ origin: webOrigin, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Liftoff API')
    .setDescription('Liftoff API with infrastructure, email authentication and forum posts.')
    .setVersion('0.1.0')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(port, API_LISTEN_HOST);
  Logger.log(`Liftoff API listening on ${API_LISTEN_HOST}:${port}/api`, 'Bootstrap');
}

void bootstrap();
