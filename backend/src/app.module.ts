import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { AuthorsModule } from './authors/authors.module';
import { CoursesModule } from './courses/courses.module';
import { ResourcesModule } from './resources/resources.module';
import { UsersModule } from './users/users.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { CertificatesModule } from './certificates/certificates.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CollectionsModule } from './collections/collections.module';

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
    // Resources module: private documents and links for admin/user spaces
    ResourcesModule,
    // Users module: admin user management
    UsersModule,
    // Quizzes module: chapter training quizzes and learner attempts
    QuizzesModule,
    // Certificates module: learner certificates after successful final tests
    CertificatesModule,
    // Notifications module: in-app learner notifications in the navbar dropdown
    NotificationsModule,
    // Collections module: admin-curated learner sections on the home page
    CollectionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
