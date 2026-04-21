# BG-Defender: Guide Implémentation Phase 1
## Refactorisation QuizzesService & Architecture Event-Driven

**Durée:** Semaines 1-2 (60 heures)  
**Équipe:** 1 Backend Lead + Code Reviews  
**Livrable:** 3 services focalisés + système events + 20 tests intégration  

---

## Vue d'Ensemble: Ce Qu'On Fait

**Avant:** 1 service monolithique QuizzesService (887 lignes)  
**Après:** 3 services focalisés + event listeners

```
Avant:
  QuizzesService (887 L) → CertificatesService (appel direct)

Après:
  QuizManagementService (240 L)
  QuizAttemptService (220 L) → émet QuizAttemptSubmitted event
  QuizQueryService (180 L)
  
  CertificateListener écoute QuizAttemptSubmitted event indépendamment
```

---

## Étape 1: Setup Event Emitter (2 heures)

### 1.1 Installer Dépendances
```bash
cd backend
npm install @nestjs/event-emitter
npm install --save-dev @types/node
```

### 1.2 Mettre à Jour app.module.ts
```typescript
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    EventEmitterModule.forRoot(), // ← AJOUTER CECI
    TypeOrmModule.forRootAsync({ useClass: DatabaseConfig }),
    // ... autres modules
  ],
})
export class AppModule {}
```

### 1.3 Créer Répertoire Events
```bash
mkdir -p src/events
touch src/events/index.ts
```

---

## Étape 2: Créer Définitions Events (1 heure)

### Fichier: src/events/quiz-attempt.submitted.event.ts
```typescript
/**
 * Event émis quand user soumet tentative quiz
 * Listeners: CertificateService (sync certificat), AnalyticsService (optional)
 */
export class QuizAttemptSubmittedEvent {
  constructor(
    public readonly userId: number,
    public readonly quizId: string,
    public readonly courseId: string | null,
    public readonly chapterId: string | null,
    public readonly passed: boolean,
    public readonly score: number,
    public readonly totalQuestions: number,
  ) {}
}

export class QuizAttemptSubmittedEventPayload {
  userId: number;
  quizId: string;
  courseId: string | null;
  chapterId: string | null;
  passed: boolean;
  score: number;
  totalQuestions: number;
}
```

### Fichier: src/events/index.ts
```typescript
export * from './quiz-attempt.submitted.event';
// Ajouter plus d'events ici au besoin
```

---

## Étape 3: Splitter QuizzesService (30 heures)

### 3.1 Extraire Types (2 heures)

**Fichier:** src/quizzes/dto/quiz-attempt.types.ts (NOUVEAU)
```typescript
export type QuizAttemptView = {
  id: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  passed: boolean;
  submittedAt: Date;
};

export type AdminQuizView = {
  id: string;
  chapterId: string;
  titleEn: string;
  titleFi: string;
  descriptionEn: string | null;
  descriptionFi: string | null;
  passingScore: number;
  isPublished: boolean;
  questions: Array<{
    id: string;
    promptEn: string;
    promptFi: string;
    explanationEn: string | null;
    explanationFi: string | null;
    type: string;
    orderIndex: number;
    options: Array<{
      id: string;
      labelEn: string;
      labelFi: string;
      orderIndex: number;
      isCorrect: boolean;
    }>;
  }>;
  stats: {
    attemptCount: number;
    latestAttemptAt: Date | null;
    bestScore: number | null;
  };
};

export type LearnerQuizView = {
  id: string;
  chapterId: string;
  titleEn: string;
  titleFi: string;
  descriptionEn: string | null;
  descriptionFi: string | null;
  passingScore: number;
  isPublished: boolean;
  questions: Array<{
    id: string;
    promptEn: string;
    promptFi: string;
    explanationEn: string | null;
    explanationFi: string | null;
    type: string;
    orderIndex: number;
    options: Array<{
      id: string;
      labelEn: string;
      labelFi: string;
      orderIndex: number;
    }>;
  }>;
  latestAttempt: QuizAttemptView | null;
  bestAttempt: QuizAttemptView | null;
};
```

### 3.2 Créer QuizManagementService (6 heures)

**Fichier:** src/quizzes/services/quiz-management.service.ts (NOUVEAU)

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz, QuizQuestion, QuizOption } from '../entities';
import { CreateQuizDto, UpdateQuizDto } from '../dto';

@Injectable()
export class QuizManagementService {
  constructor(
    @InjectRepository(Quiz) private readonly quizRepo: Repository<Quiz>,
    @InjectRepository(QuizQuestion) private readonly questionRepo: Repository<QuizQuestion>,
    @InjectRepository(QuizOption) private readonly optionRepo: Repository<QuizOption>,
  ) {}

  /**
   * Créer ou mettre à jour quiz chapitre
   * Extraction depuis ancien QuizzesService lignes 131-160
   */
  async upsertChapterQuiz(
    courseId: string,
    chapterId: string,
    dto: CreateQuizDto
  ): Promise<Quiz> {
    let quiz = await this.quizRepo.findOne({
      where: { chapterId, courseId },
    });

    if (!quiz) {
      quiz = this.quizRepo.create({
        courseId,
        chapterId,
        ...dto,
      });
    } else {
      Object.assign(quiz, dto);
    }

    return this.quizRepo.save(quiz);
  }

  /**
   * Supprimer quiz chapitre
   */
  async deleteChapterQuiz(
    courseId: string,
    chapterId: string
  ): Promise<void> {
    await this.quizRepo.delete({
      courseId,
      chapterId,
    });
  }

  /**
   * Mettre à jour questions quiz
   */
  async updateQuizQuestions(
    quizId: string,
    questionsDto: any[]
  ): Promise<void> {
    // Supprimer anciennes questions
    await this.questionRepo.delete({ quizId });

    // Créer nouvelles questions
    const questions = questionsDto.map((q, idx) => ({
      quizId,
      promptEn: q.promptEn,
      promptFi: q.promptFi,
      explanationEn: q.explanationEn,
      explanationFi: q.explanationFi,
      type: q.type,
      orderIndex: idx,
      options: q.options.map((opt: any, optIdx: number) => ({
        labelEn: opt.labelEn,
        labelFi: opt.labelFi,
        orderIndex: optIdx,
        isCorrect: opt.isCorrect,
      })),
    }));

    // Sauvegarder questions + options
    for (const question of questions) {
      const questionEntity = await this.questionRepo.save(
        this.questionRepo.create(question)
      );
      await this.optionRepo.save(
        question.options.map(opt => ({
          ...opt,
          questionId: questionEntity.id,
        }))
      );
    }
  }
}
```

### 3.3 Créer QuizAttemptService (6 heures)

**Fichier:** src/quizzes/services/quiz-attempt.service.ts (NOUVEAU)

```typescript
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizAttempt } from '../entities';
import { QuizAttemptSubmittedEvent } from '../../events';

@Injectable()
export class QuizAttemptService {
  constructor(
    @InjectRepository(QuizAttempt) private readonly attemptRepo: Repository<QuizAttempt>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Soumettre tentative quiz chapitre
   * Extraction depuis ancien QuizzesService lignes 301-360
   */
  async submitChapterQuizAttempt(
    userId: number,
    quizId: string,
    courseId: string,
    chapterId: string,
    answers: Record<string, string>
  ): Promise<QuizAttemptView> {
    // 1. Évaluer réponses
    const { score, passed, totalQuestions } = await this.evaluateAnswers(
      quizId,
      answers
    );

    // 2. Sauvegarder tentative
    const attempt = await this.attemptRepo.save({
      userId,
      quizId,
      answers: JSON.stringify(answers),
      score,
      passed,
      submittedAt: new Date(),
    });

    // 3. Émettre event (certificat se sync asynchonously)
    this.eventEmitter.emit(
      'quiz.attempt.submitted',
      new QuizAttemptSubmittedEvent(
        userId,
        quizId,
        courseId,
        chapterId,
        passed,
        score,
        totalQuestions
      )
    );

    return this.toAttemptView(attempt);
  }

  /**
   * Évaluer réponses utilisateur
   */
  private async evaluateAnswers(
    quizId: string,
    answers: Record<string, string>
  ): Promise<{ score: number; passed: boolean; totalQuestions: number }> {
    // Logique d'évaluation du ancien QuizzesService lignes 360-400
    const quiz = await this.getQuiz(quizId);
    let correctCount = 0;

    for (const [questionId, selectedOptionId] of Object.entries(answers)) {
      const question = quiz.questions.find(q => q.id === questionId);
      const isCorrect = question?.options.find(
        o => o.id === selectedOptionId
      )?.isCorrect;
      if (isCorrect) correctCount++;
    }

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    return {
      score,
      passed,
      totalQuestions: quiz.questions.length,
    };
  }

  /**
   * Convertir attempt entity à view
   */
  private toAttemptView(attempt: QuizAttempt): QuizAttemptView {
    return {
      id: attempt.id,
      score: attempt.score,
      passed: attempt.passed,
      submittedAt: attempt.submittedAt,
      correctAnswers: Math.round((attempt.score / 100) * (attempt.totalQuestions || 0)),
      totalQuestions: attempt.totalQuestions || 0,
    };
  }
}
```

### 3.4 Créer QuizQueryService (6 heures)

**Fichier:** src/quizzes/services/quiz-query.service.ts (NOUVEAU)

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz, QuizAttempt } from '../entities';
import { User } from '../../users/entities';

@Injectable()
export class QuizQueryService {
  constructor(
    @InjectRepository(Quiz) private readonly quizRepo: Repository<Quiz>,
    @InjectRepository(QuizAttempt) private readonly attemptRepo: Repository<QuizAttempt>,
  ) {}

  /**
   * Récupérer quiz chapitre pour admin
   * Extraction depuis ancien QuizzesService lignes 466-495
   */
  async getChapterQuizForAdmin(chapterId: string): Promise<AdminQuizView> {
    const quiz = await this.quizRepo.findOne({
      where: { chapterId },
      relations: ['questions', 'questions.options'],
    });

    if (!quiz) return null;

    const stats = await this.getQuizStats(quiz.id);

    return {
      id: quiz.id,
      chapterId: quiz.chapterId,
      titleEn: quiz.titleEn,
      titleFi: quiz.titleFi,
      descriptionEn: quiz.descriptionEn,
      descriptionFi: quiz.descriptionFi,
      passingScore: quiz.passingScore,
      isPublished: quiz.isPublished,
      questions: quiz.questions.map(q => ({
        id: q.id,
        promptEn: q.promptEn,
        promptFi: q.promptFi,
        explanationEn: q.explanationEn,
        explanationFi: q.explanationFi,
        type: q.type,
        orderIndex: q.orderIndex,
        options: q.options.map(opt => ({
          id: opt.id,
          labelEn: opt.labelEn,
          labelFi: opt.labelFi,
          orderIndex: opt.orderIndex,
          isCorrect: opt.isCorrect,
        })),
      })),
      stats,
    };
  }

  /**
   * Récupérer quiz chapitre pour learner
   * Extraction depuis ancien QuizzesService lignes 560-600
   */
  async getChapterQuizForLearner(
    chapterId: string,
    currentUser: User
  ): Promise<LearnerQuizView> {
    const quiz = await this.quizRepo.findOne({
      where: { chapterId },
      relations: ['questions', 'questions.options'],
    });

    if (!quiz) return null;

    // Retirer réponses correctes (security)
    const questionsWithoutAnswers = quiz.questions.map(q => ({
      ...q,
      options: q.options.map(opt => ({
        id: opt.id,
        labelEn: opt.labelEn,
        labelFi: opt.labelFi,
        orderIndex: opt.orderIndex,
        // ⚠️ isCorrect intentionnellement omis
      })),
    }));

    // Récupérer tentatives utilisateur
    const latestAttempt = await this.getLatestAttempt(quiz.id, currentUser.id);
    const bestAttempt = await this.getBestAttempt(quiz.id, currentUser.id);

    return {
      id: quiz.id,
      chapterId: quiz.chapterId,
      titleEn: quiz.titleEn,
      titleFi: quiz.titleFi,
      descriptionEn: quiz.descriptionEn,
      descriptionFi: quiz.descriptionFi,
      passingScore: quiz.passingScore,
      isPublished: quiz.isPublished,
      questions: questionsWithoutAnswers,
      latestAttempt,
      bestAttempt,
    };
  }

  /**
   * Récupérer stats quiz
   */
  private async getQuizStats(quizId: string) {
    const attempts = await this.attemptRepo.find({ where: { quizId } });
    return {
      attemptCount: attempts.length,
      latestAttemptAt: attempts.length > 0 
        ? new Date(Math.max(...attempts.map(a => a.submittedAt.getTime())))
        : null,
      bestScore: attempts.length > 0
        ? Math.max(...attempts.map(a => a.score))
        : null,
    };
  }

  private async getLatestAttempt(
    quizId: string,
    userId: number
  ): Promise<QuizAttemptView | null> {
    const attempt = await this.attemptRepo.findOne({
      where: { quizId, userId },
      order: { submittedAt: 'DESC' },
    });
    return attempt ? this.toAttemptView(attempt) : null;
  }

  private async getBestAttempt(
    quizId: string,
    userId: number
  ): Promise<QuizAttemptView | null> {
    const attempt = await this.attemptRepo.findOne({
      where: { quizId, userId },
      order: { score: 'DESC' },
    });
    return attempt ? this.toAttemptView(attempt) : null;
  }

  private toAttemptView(attempt: QuizAttempt): QuizAttemptView {
    return {
      id: attempt.id,
      score: attempt.score,
      passed: attempt.passed,
      submittedAt: attempt.submittedAt,
      correctAnswers: Math.round((attempt.score / 100) * 10), // TODO: obtenir total questions
      totalQuestions: 10, // TODO: obtenir du quiz
    };
  }
}
```

### 3.5 Mettre à Jour Ancien QuizzesService

**Fichier:** src/quizzes/quizzes.service.ts (DEPRECATED)

```typescript
/**
 * DEPRECATED: Cette classe est remplacée par:
 * - QuizManagementService (CRUD)
 * - QuizAttemptService (tentatives)
 * - QuizQueryService (requêtes)
 * 
 * Garder temporairement pour compatibilité backwards, puis retirer.
 */
import { Injectable, Deprecated } from '@nestjs/common';
import { QuizManagementService } from './quiz-management.service';
import { QuizAttemptService } from './quiz-attempt.service';
import { QuizQueryService } from './quiz-query.service';

@Injectable()
@Deprecated('Use QuizManagementService, QuizAttemptService, QuizQueryService instead')
export class QuizzesService {
  constructor(
    private readonly managementService: QuizManagementService,
    private readonly attemptService: QuizAttemptService,
    private readonly queryService: QuizQueryService,
  ) {}

  // Proxy methods pour transition graduelle
  async upsertChapterQuiz(courseId, chapterId, dto) {
    return this.managementService.upsertChapterQuiz(courseId, chapterId, dto);
  }

  async submitChapterQuizAttempt(userId, quizId, courseId, chapterId, answers) {
    return this.attemptService.submitChapterQuizAttempt(
      userId,
      quizId,
      courseId,
      chapterId,
      answers
    );
  }

  async getChapterQuizForAdmin(chapterId) {
    return this.queryService.getChapterQuizForAdmin(chapterId);
  }

  async getChapterQuizForLearner(chapterId, currentUser) {
    return this.queryService.getChapterQuizForLearner(chapterId, currentUser);
  }
}
```

---

## Étape 4: Créer Event Listeners (5 heures)

**Fichier:** src/certificates/listeners/quiz-attempt.listener.ts (NOUVEAU)

```typescript
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { QuizAttemptSubmittedEvent } from '../../events';
import { CertificatesService } from '../certificates.service';

@Injectable()
export class QuizAttemptListener {
  constructor(private readonly certificatesService: CertificatesService) {}

  /**
   * Listener pour event QuizAttemptSubmitted
   * Remplace l'ancienne logique directe dans QuizzesService
   * 
   * Avant: QuizzesService.submitAttempt → appel direct CertificatesService
   * Après: QuizzesService émet event → listener reçoit async
   */
  @OnEvent('quiz.attempt.submitted')
  async onQuizAttemptSubmitted(event: QuizAttemptSubmittedEvent) {
    if (event.passed && event.courseId) {
      // Sync certificat seulement si quiz passed et c'est test final course
      await this.certificatesService.syncCourseCertificate(
        event.userId,
        event.courseId
      );
    }
  }
}
```

---

## Étape 5: Tests Intégration (10 heures)

**Fichier:** src/quizzes/services/quiz-attempt.service.spec.ts

```typescript
describe('QuizAttemptService', () => {
  let service: QuizAttemptService;
  let eventEmitter: EventEmitter2;
  let quizAttemptRepo: Repository<QuizAttempt>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        QuizAttemptService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(QuizAttempt),
          useValue: {
            save: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QuizAttemptService>(QuizAttemptService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    quizAttemptRepo = module.get<Repository<QuizAttempt>>(
      getRepositoryToken(QuizAttempt)
    );
  });

  describe('submitChapterQuizAttempt', () => {
    it('devrait émettre QuizAttemptSubmittedEvent après soumission', async () => {
      const userId = 1;
      const quizId = 'quiz-1';
      const answers = { 'q-1': 'opt-1', 'q-2': 'opt-2' };

      await service.submitChapterQuizAttempt(
        userId,
        quizId,
        'course-1',
        'chapter-1',
        answers
      );

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'quiz.attempt.submitted',
        expect.any(QuizAttemptSubmittedEvent)
      );
    });

    it('devrait sauvegarder tentative avec score', async () => {
      // Test...
    });
  });
});
```

---

## Étape 6: Migrer Controllers (3 heures)

**Fichier:** src/quizzes/quizzes.controller.ts (MISE À JOUR)

```typescript
@Controller('api/quizzes')
export class QuizzesController {
  constructor(
    private readonly quizManagementService: QuizManagementService,
    private readonly quizAttemptService: QuizAttemptService,
    private readonly quizQueryService: QuizQueryService,
  ) {}

  @Post(':courseId/:chapterId')
  @UseGuards(AdminRoleGuard)
  async upsertChapterQuiz(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Body() dto: CreateQuizDto,
  ) {
    return this.quizManagementService.upsertChapterQuiz(
      courseId,
      chapterId,
      dto
    );
  }

  @Get(':courseId/:chapterId')
  async getChapterQuiz(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @CurrentUser() user?: User,
  ) {
    if (user?.role === 'admin') {
      return this.quizQueryService.getChapterQuizForAdmin(chapterId);
    }
    return this.quizQueryService.getChapterQuizForLearner(chapterId, user);
  }

  @Post(':courseId/:chapterId/submit')
  async submitChapterQuizAttempt(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Param('quizId') quizId: string,
    @Body() dto: SubmitQuizAttemptDto,
    @CurrentUser() user: User,
  ) {
    return this.quizAttemptService.submitChapterQuizAttempt(
      user.id,
      quizId,
      courseId,
      chapterId,
      dto.answers
    );
  }
}
```

---

## Checklist Complétion Phase 1

- [ ] Event Emitter installé et configuré dans app.module.ts
- [ ] Events créés (QuizAttemptSubmittedEvent)
- [ ] QuizManagementService créé et testé
- [ ] QuizAttemptService créé et testé
- [ ] QuizQueryService créé et testé
- [ ] Event Listeners créés
- [ ] Controllers migrés
- [ ] 20+ tests intégration passants
- [ ] Ancien QuizzesService deprecated (mais encore fonctionnel)
- [ ] Code review passé
- [ ] Déployé sur staging
- [ ] Tests smoke validés

---

## Prochaines Étapes

**Semaine 3+:**
1. Splitter NotificationsService (même approche)
2. Split CoursesService
3. Phase 2: Frontend refactoring
