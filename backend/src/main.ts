import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { seedCourses } from './database/seeds/courses.seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global API prefix
  app.setGlobalPrefix('api');

  // CORS configuration
  app.enableCors({
    origin: 'http://localhost:3000', // Frontend URL
    credentials: true,
  });

  // ValidationPipe globale: bloque les payloads invalides
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Run seeds
  const dataSource = app.get(DataSource);
  console.log('[MAIN] DataSource obtained from DI');
  console.log('[MAIN] DataSource connected:', dataSource.isInitialized);

  try {
    console.log('[MAIN] Starting seed execution...');
    await seedCourses(dataSource);
    console.log('[MAIN] Seed execution completed successfully');
  } catch (error) {
    console.error('[MAIN] Seed execution failed:', error);
  }

  await app.listen(process.env.PORT ?? 3001);
  console.log(`[MAIN] Server started on port ${process.env.PORT ?? 3001}`);
}
bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
