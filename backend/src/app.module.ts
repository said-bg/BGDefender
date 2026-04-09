import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { AuthorsModule } from './authors/authors.module';
import { CoursesModule } from './courses/courses.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Global config (read .env)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // TypeORM with async config (uses ConfigService + DatabaseConfig)
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    // Auth module: register, login, JWT
    AuthModule,
    // Authors module: CRUD for authors (reusable across features)
    AuthorsModule,
    // Courses module: course management (depends on authors)
    CoursesModule,
    // Users module: admin user management
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
