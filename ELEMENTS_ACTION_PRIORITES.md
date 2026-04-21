# BG-Defender - Éléments Action Priorités

**Dernière Mise à Jour:** 21 Avril 2026  
**Total Problèmes:** 68 | **Critique:** 5 | **Haut:** 12 | **Moyen:** 35+

---

## 🚨 CRITIQUE - À FAIRE AVANT DÉPLOIEMENT

### 1. Rotationner Identifiants Exposés (⏰ URGENT - 1 heure)

**Statut:** 🔴 BLOQUANT PRODUCTION

**Éléments Action:**
- [ ] Changer mot de passe SMTP (compte satbh911@gmail.com compromis)
- [ ] Régénérer JWT_SECRET - générer string 64 caractères aléatoires
- [ ] Changer DATABASE_PASSWORD
- [ ] Mettre à jour identifiants dans vault production
- [ ] Scanner historique git pour expositions identifiants:
  ```bash
  git log -p --all -S "ltreafmrebrdrxly" 
  git log -p --all -S "satbh911@gmail.com"
  ```
- [ ] Force push retirer identifiants historique si trouvés
- [ ] Notifier utilisateurs qui auraient pu être exposés

**Fichiers Affectés:**
- `backend/.env` (actuellement contient identifiants exposés)

---

### 2. Corriger Configuration Environment (⏰ 2 heures)

**Éléments Action:**
- [ ] **Retirer `.env` version control:**
  ```bash
  git rm --cached backend/.env
  echo "/.env*" >> .gitignore
  git add .gitignore
  git commit -m "Retirer fichiers .env version control"
  ```

- [ ] **Créer template `.env.example`** (pas secrets):
  ```env
  NODE_ENV=development
  PORT=3001
  DATABASE_HOST=localhost
  DATABASE_PORT=3306
  DATABASE_USERNAME=<votre-user>
  DATABASE_PASSWORD=<votre-password>
  DATABASE_NAME=<votre-db>
  JWT_SECRET=<generate-64-char-random>
  JWT_EXPIRES_IN=1d
  FRONTEND_URL=http://localhost:3000
  CORS_ORIGIN=<votre-cors>
  SEED_ON_BOOT=false
  SMTP_HOST=<smtp-host>
  SMTP_PORT=587
  SMTP_USER=<smtp-user>
  SMTP_PASS=<smtp-password>
  ```

- [ ] **Créer `.env.production` pour déploiement** (pas dans git, utiliser outil déploiement)

**Fichiers À Créer/Mettre à Jour:**
- `backend/.env.example` (nouveau)
- `.gitignore` (mettre à jour)

---

### 3. Réduire Service Quizzes de 887 à ~250 lignes (⏰ 3-5 jours)

**Fichier:** `backend/src/quizzes/quizzes.service.ts`

**Problèmes Actuels:**
- Classe 887 lignes unique mélangeant 8+ responsabilités
- Difficile tester
- Difficile maintenir

**Plan Refactorisation:**
```typescript
// Splitter en 4 services focalisés:

1. QuizzesReadService (interface publique)
   - getChapterQuiz(courseId, chapterId, currentUser)
   - getCourseFinalTest(courseId, currentUser)

2. QuizzesWriteService (mutations admin)
   - upsertChapterQuiz()
   - upsertCourseFinalTest()
   - deleteChapterQuiz()
   - deleteCourseFinalTest()

3. QuizAttemptsService (soumissions learner)
   - submitChapterQuizAttempt()
   - submitCourseFinalTestAttempt()

4. QuizViewBuilder (formatage réponses)
   - buildAdminQuizView()
   - buildLearnerQuizView()
   - buildAdminFinalTestView()
   - buildLearnerFinalTestView()
   - toAttemptView()
```

**Éléments Action:**
- [ ] Créer `quiz-read.service.ts` logique lecture
- [ ] Créer `quiz-write.service.ts` logique mutation
- [ ] Créer `quiz-attempts.service.ts` logique soumission
- [ ] Créer `quiz-view-builder.service.ts` mapping réponses
- [ ] Créer `quiz.module.ts` wirer dépendances
- [ ] Mettre à jour `quizzes.controller.ts` utiliser services
- [ ] Mettre à jour tests structure nouvelle
- [ ] Vérifier fonctionnalité tous endpoints

---

### 4. Ajouter Tests Unitaires Manquants - 3 Services (⏰ 2-3 jours)

**Services Critiques Sans Tests:**

#### A. CoursesService (`backend/src/courses/services/course.service.ts`)
```typescript
// Ajouter tests pour:
// 1. create() - ajoute cours avec auteurs
// 2. findOne() - récupère cours avec relations
// 3. update() - met à jour champs cours
// 4. delete() - supprime cours
// 5. getAdminSummary() - retourne stats
```

**Minimum 8 tests nécessaires**

#### B. NotificationsService (`backend/src/notifications/notifications.service.ts`)
```typescript
// Ajouter tests pour:
// 1. listMyNotifications() - retourne notifications user
// 2. markAsRead() - met à jour statut notification
// 3. markAllAsRead() - mise à jour bulk
// 4. deleteNotification() - supprime notification
// 5. removeOrphanedNotifications() - cleanup
// 6. notifyCoursePublished() - crée notification
```

**Minimum 8 tests nécessaires**

#### C. EmailService (`backend/src/email/email.service.ts`)
```typescript
// Ajouter tests pour:
// 1. sendPasswordReset() - envoie email reset
// 2. sendCertificateIssued() - envoie email certificat
// 3. Mock connexion SMTP
// 4. Gestion erreurs défaillance SMTP
```

**Minimum 4 tests nécessaires**

**Éléments Action:**
- [ ] Créer `backend/src/courses/services/course.service.spec.ts`
- [ ] Créer `backend/src/notifications/notifications.service.spec.ts`
- [ ] Créer `backend/src/email/email.service.spec.ts`
- [ ] Exécuter `npm run test:cov` vérifier couverture >50%

---

### 5. Retirer Console.logs Code Production (⏰ 2 heures)

**Fichiers avec Logging Console (21+ instances):**

| Fichier | Ligne(s) | Action |
|---------|---------|--------|
| `backend/src/main.ts` | 69 | Remplacer avec logger |
| `frontend/src/utils/apiError.ts` | 29, 38, 58 | Retirer ou utiliser logger |
| `frontend/src/components/navbar/NavbarNotifications.tsx` | 58, 138, 158, 204 | Retirer error logging |
| `frontend/src/hooks/useFavoriteCourses.ts` | 30, 85 | Retirer error logging |
| `frontend/src/features/courses/course-detail/useCourseProgressSync.ts` | 132, 186 | Retirer verbose logging |
| `frontend/src/services/api/jwtInterceptor.ts` | 27, 65, 91, 139 | Remplacer avec logger |

**Option Solution 1 - Retirer entièrement:**
```bash
# Chercher logs console
grep -r "console\." backend/src --include="*.ts" | grep -v "spec.ts"
grep -r "console\." frontend/src --include="*.ts" --include="*.tsx" | grep -v "test."

# Retirer ou remplacer chacun
```

**Option Solution 2 - Ajouter service logging:**
```typescript
// Créer backend/src/common/logging/logger.service.ts
@Injectable()
export class LoggerService {
  private logger = new Logger('AppLogger');
  
  debug(message: string, data?: any) { /* seulement en dev */ }
  info(message: string, data?: any) { }
  warn(message: string, data?: any) { }
  error(message: string, error?: any) { }
}
```

**Éléments Action:**
- [ ] Soit retirer tous console.logs OU
- [ ] Créer LoggerService et remplacer tous console.logs
- [ ] Chercher `console.` vérifier retrait: `grep -r "console\." backend/src frontend/src`

---

## ⚠️ PRIORITÉ HAUTE - AVANT RELEASE

### 6. Ajouter Tests E2E Scénarios Erreurs (⏰ 2-3 jours)

**Fichier:** `frontend/e2e/*.spec.ts`

**Couverture E2E Actuelle:** Seulement happy path (12 suites test)

**Manquant:** Scénarios erreurs

**Ajouter Tests Pour:**
- [ ] Erreurs timeout réseau
- [ ] Défaillances authentification (token expiré)
- [ ] Refus autorisations (accès non-admin)
- [ ] Erreurs API (500, 404, 409)
- [ ] Erreurs validation formulaires
- [ ] Défaillances upload fichiers

**Exemple Test:**
```typescript
// frontend/e2e/error-scenarios.spec.ts
test('devrait montrer erreur soumission quiz échoue', async ({ page }) => {
  await page.route('**/api/quizzes/*/submit', route => 
    route.abort('failed')
  );
  
  await page.goto('/courses/123/quiz');
  await page.click('[data-testid="submit-quiz"]');
  
  await expect(page.locator('[data-testid="error-message"]')).toContainText(
    'Échec soumission quiz'
  );
});
```

**Éléments Action:**
- [ ] Créer `frontend/e2e/error-scenarios.spec.ts`
- [ ] Ajouter 10+ tests scénarios erreurs
- [ ] Exécuter `npm run test:e2e` vérifier tous passent

---

### 7. Splitter Grands Composants Frontend (⏰ 2-3 jours)

**Composants > 300 Lignes:**

| Fichier | Lignes | Recommandation |
|---------|--------|-----------------|
| `CourseFinalTest.tsx` | 454 | Splitter logique quiz en 3 composants |
| `AdminResourcesPage.tsx` | 409 | Splitter formulaire, liste, toolbar |
| `AdminCollectionsForm.tsx` | 355 | Extraire validation formulaire |
| `richTextBlockEditor.extensions.ts` | 464 | Splitter par gestion type média |
| `ResourcesPage.tsx` | 352 | Extraire composant formulaire |

**Exemple: Refactorisation CourseFinalTest.tsx**
```typescript
// Avant: 454 lignes dans 1 composant
export default function CourseFinalTest({ ... }) { ... }

// Après: Splitter en 3 composants
export default function CourseFinalTest({ ... }) {
  return (
    <>
      <FinalTestHeader /> {/* Titre quiz, instructions */}
      <FinalTestQuestions /> {/* Questions + sélection réponses */}
      <FinalTestSubmit /> {/* Bouton soumettre + aperçu certificat */}
    </>
  );
}
```

**Éléments Action:**
- [ ] Refactoriser `CourseFinalTest.tsx` → 3 composants
- [ ] Refactoriser `ChapterTrainingQuiz.tsx` → composants quiz partagés
- [ ] Extraire `AdminResourcesForm.tsx` de `AdminResourcesPage.tsx`
- [ ] Extraire `AdminCollectionsFormContent.tsx` de formulaire

---

### 8. Corriger Lacunes Configuration TypeScript (⏰ 1-2 heures)

**Problème Config Jest Frontend:**

**Fichier:** `frontend/jest.config.ts`

**Pattern Actuel (trop restrictif):**
```typescript
testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx']
```

**Problème:** Exige tests dans subdirectoires `__tests__`

**Correction:**
```typescript
testMatch: [
  '**/__tests__/**/*.test.ts',
  '**/__tests__/**/*.test.tsx',
  '**/*.test.ts',
  '**/*.test.tsx'
]
```

**Config Playwright Backend:**

**Fichier:** `frontend/playwright.config.ts`

**Ajouter config manquante:**
```typescript
export default defineConfig({
  testDir: './e2e',
  baseURL: process.env.PLAYWRIGHT_TEST_URL || 'http://localhost:3000',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  reporter: ['html', 'json', 'junit'],
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
});
```

**Éléments Action:**
- [ ] Mettre à jour `frontend/jest.config.ts` pattern test
- [ ] Ajouter reporters + baseURL à `frontend/playwright.config.ts`
- [ ] Test: `npm run test` et `npm run test:e2e`

---

### 9. Extraire Patterns Code Dupliqué (⏰ 4-5 jours)

**Duplications Plus Grand Impact:**

#### Pattern 1: Gestion Erreurs (15+ instances)
**Créer:** `backend/src/common/errors/error-handler.service.ts`

**Statut:** Avant Refactor ❌
```typescript
// Répété 15+ fois:
if (!result) throw new NotFoundException('Entity not found');
if (!isValid) throw new BadRequestException('Invalid input');
```

**Statut:** Après Refactor ✅
```typescript
// Centralisé
@Injectable()
export class ErrorHandler {
  notFound(entity: string) {
    return new NotFoundException(`${entity} not found`);
  }
  invalid(field: string) {
    return new BadRequestException(`${field} is invalid`);
  }
}

// Usage
this.errorHandler.notFound('User');
```

#### Pattern 2: État Quiz (2 composants)
**Créer:** `frontend/src/hooks/useQuizState.ts`

**Statut:** Avant ❌
```typescript
// Dupliqué dans ChapterTrainingQuiz.tsx + CourseFinalTest.tsx
const [quiz, setQuiz] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [selectedAnswers, setSelectedAnswers] = useState({});
const [isSubmitting, setIsSubmitting] = useState(false);
```

**Statut:** Après ✅
```typescript
// Custom hook
export const useQuizState = () => {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  // ... etc
  return { quiz, loading, setQuiz, /* ... */ };
};

// Usage
const { quiz, loading } = useQuizState();
```

#### Pattern 3: Upload Fichiers (3 controllers)
**Créer:** `backend/src/common/file-upload/file-upload.service.ts`

#### Pattern 4: Repository Finding (8+ instances)
**Créer:** `BaseRepository` avec `findManyOrFail()`

**Éléments Action:**
- [ ] Créer error-handler.service.ts
- [ ] Créer useQuizState.ts hook
- [ ] Créer FileUploadService
- [ ] Créer BaseRepository
- [ ] Mettre à jour tous services utiliser helpers
- [ ] Exécuter tests vérifier fonctionnalité

---

### 10. Optimisation Indexes Database (⏰ 1 jour)

**Indexes Manquants:**

```sql
-- Ajouter à db_schema.sql ou créer migration

-- Notifications querying par user
CREATE INDEX idx_notifications_user_created 
  ON notifications(userId, createdAt DESC);

-- Quiz attempts querying par user et quiz
CREATE INDEX idx_quiz_attempts_user_quiz 
  ON quiz_attempts(userId, quizId, submittedAt DESC);

-- Progress tracking par user et course
CREATE INDEX idx_progress_user_course 
  ON progress(userId, courseId);

-- Course collection item ordering
CREATE INDEX idx_collection_items_order 
  ON course_collection_items(collectionId, orderIndex);
```

**Éléments Action:**
- [ ] Créer fichier migration avec indexes
- [ ] Exécuter migration base test
- [ ] Vérifier pas régressions performance
- [ ] Déployer avec migration

---

## 📋 PRIORITÉ MOYENNE - APRÈS DÉPLOIEMENT

### 11. Consolider Définitions Types (⏰ 1-2 jours)

**Fichier:** `frontend/src/services/course/course.types.ts` (369 lignes)

**Splitter en fichiers séparés:**
```
frontend/src/services/course/
├── course.types.ts (50 lignes - interface Course)
├── chapter.types.ts (40 lignes - interfaces Chapter)
├── quiz.types.ts (80 lignes - interfaces Quiz/question)
├── content.types.ts (50 lignes - interfaces Content)
└── index.ts (exports tous)
```

**Éléments Action:**
- [ ] Créer fichiers types séparés
- [ ] Mettre à jour imports frontend
- [ ] Vérifier pas conflits types
- [ ] Test build: `npm run build`

---

### 12. Améliorer Cohérence Gestion Erreurs (⏰ 2 jours)

**Problème:** Capture erreurs et reporting inconsistents

**Exemple:**
```typescript
// AVANT - Inconsistant
try {
  await this.repository.save(entity);
} catch (error) {
  // Certains services throw, autres retournent null, autres log
  throw error;
}

// APRÈS - Consistant
try {
  await this.repository.save(entity);
} catch (error) {
  this.logger.error('Failed to save entity', error);
  throw this.errorHandler.handle(error);
}
```

**Éléments Action:**
- [ ] Ajouter utilitaire error handler
- [ ] Ajouter service logging
- [ ] Créer guard gestion erreurs
- [ ] Mettre à jour tous services pattern consistant

---

### 13. Amélioration Database Seed (⏰ 1 jour)

**Fichier:** `backend/src/database/seeds/courses.seed.ts` (455 lignes)

**Problème:** Données cours hard-codées, pas cleanup

**Solution:**
```typescript
// Déplacer vers JSON config
backend/src/database/seeds/courses-data.json

// Créer factory
backend/src/database/seeds/course.factory.ts

// Ajouter cleanup
beforeEach(async () => cleanDatabase());
```

**Éléments Action:**
- [ ] Créer `courses-data.json` avec données seed
- [ ] Créer factory cours avec builder template
- [ ] Ajouter database cleanup tests
- [ ] Réduire courses.seed.ts de 455 à ~150 lignes

---

### 14. Ajouter Migrations TypeORM (⏰ 2 jours)

**Statut:** Actuellement utiliser schema SQL brut

**Générer migration depuis entities:**
```bash
typeorm migration:generate src/migrations/InitialSchema
```

**Bénéfices:**
- Version control changements schema
- Rollbacks faciles
- Consistant partout environments

**Éléments Action:**
- [ ] Générer migration initiale
- [ ] Tester migration up/down
- [ ] Retirer db_schema.sql brut déploiement

---

### 15. Implémenter Service Logging (⏰ 1 jour)

**Ajouter logger Winston/Pino:**
```typescript
// backend/src/common/logging/logger.service.ts
import * as winston from 'winston';

@Injectable()
export class LoggerService {
  private logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' })
    ]
  });
  
  info(message: string, meta?: any) { ... }
  error(message: string, error: Error) { ... }
}
```

**Éléments Action:**
- [ ] Installer winston: `npm install winston`
- [ ] Créer LoggerService
- [ ] Remplacer tous console.logs avec logger
- [ ] Configurer rotation logs production

---

## 📊 RÉSUMÉ

| Priorité | Count | Est. Jours | Statut |
|----------|-------|-----------|--------|
| 🚨 Critique | 5 | 10-12 | **BLOQUANT** |
| ⚠️ Haut | 10 | 15-20 | **REQUIS** |
| 📋 Moyen | 15+ | 10-15 | **RECOMMANDÉ** |
| **TOTAL** | **30+** | **35-47** | |

---

## Prochaines Étapes

1. **Cette Semaine (Critique):**
   - [ ] Rotationner identifiants
   - [ ] Corriger gestion `.env`
   - [ ] Ajouter 3 tests services manquants
   - [ ] Retirer console.logs

2. **Semaine Prochaine (Priorité Haute):**
   - [ ] Splitter service quizzes
   - [ ] Corriger config database
   - [ ] Ajouter tests E2E erreurs
   - [ ] Extraire code dupliqué

3. **Semaines 3-4 (Priorité Moyenne):**
   - [ ] Refactoriser composants
   - [ ] Splitter définitions types
   - [ ] Ajouter migrations
   - [ ] Implémenter logging

---

**Questions?** Consulter [RAPPORT_AUDIT_COMPLET.md](RAPPORT_AUDIT_COMPLET.md) pour analyse détaillée.
