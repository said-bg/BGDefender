import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { seedCourses } from './database/seeds/courses.seed';
import { seedUsers } from './database/seeds/users.seed';

function resolveCorsOrigins(
  configService: ConfigService,
  isProduction: boolean,
): string[] {
  const configuredOrigins =
    configService.get<string>('CORS_ORIGIN') ||
    configService.get<string>('FRONTEND_URL');

  if (configuredOrigins) {
    return configuredOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  return isProduction ? [] : ['http://localhost:3000'];
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const isProduction = configService.get('NODE_ENV') === 'production';
  const corsOrigins = resolveCorsOrigins(configService, isProduction);

  // Set global API prefix
  app.setGlobalPrefix('api');

  // CORS configuration
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : false,
    credentials: true,
  });

  app.use('/uploads/resources', (_request: Request, response: Response) => {
    response.sendStatus(404);
  });

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // ValidationPipe globale: bloque les payloads invalides
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const shouldSeedOnBoot =
    !isProduction &&
    configService.get<string>('SEED_ON_BOOT', 'false') === 'true';

  if (shouldSeedOnBoot) {
    // Keep the course seed opt-in for development bootstrapping only.
    const dataSource = app.get(DataSource);

    try {
      await seedUsers(dataSource);
      await seedCourses(dataSource);
    } catch (error) {
      console.error('[MAIN] Seed execution failed:', error);
    }
  }

  await app.listen(process.env.PORT ?? 3001);
  console.log(`[MAIN] Server started on port ${process.env.PORT ?? 3001}`);
}
bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
