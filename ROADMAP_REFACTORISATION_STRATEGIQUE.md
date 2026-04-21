# BG-Defender: Roadmap Refactorisation Stratégique
## Initiative Enterprise 3-4 Mois

**Dernière Mise à Jour:** Avril 2026  
**Scope:** Optimisation architecture full-stack  
**Effort Équipe Estimé:** 480-640 heures développeur  

---

## RÉSUMÉ EXÉCUTIF

Le codebase BG-Defender est fonctionnel mais exhibit **dette architecturale critique** qui impactera sévèrement maintenance, tests, et scaling. Cette roadmap priorise **refactorisations haut-impact, faible-risque** qui resolvent vrais problèmes affectant productivité.

### Trouvailles Clés:
- **Service monolithique 887 lignes** (QuizzesService) contenant préoccupations mixtes
- **Gestion état frontend fragmentée** across multiples patterns
- **73 fichiers CSS** sans système design centralisé ou thème
- **Couplage serré** entre modules crée risques dépendance circulaire
- **Patterns N+1 query** dans chemins récupération connaissance
- **Lacunes testing** aux frontières intégration/E2E
- **Duplication code** dans utilitaires, validation, gestion erreurs

---

## 1. ANALYSE ARCHITECTURE

### 1.1 Évaluation Structure Modules Backend

#### Architecture Actuelle (Modules Backend)
```
src/
├── auth/              ✅ Bien-scoped (JWT, Passport strategies)
├── users/             ✅ Single responsibility (CRUD utilisateurs)
├── authors/           ✅ Isolé, pas cross-dependencies
├── courses/           ⚠️ Large (339-ligne controller, 7 services)
│   ├── course.service.ts (gère CRUD cours + notifications)
│   ├── chapters.service.ts
│   ├── sub-chapters.service.ts
│   ├── progress.service.ts
│   ├── favorite.service.ts
│   ├── pedagogical-contents.service.ts
│   └── 6 controllers
├── quizzes/           🔴 CRITIQUE: 887-ligne service
│   ├── quizzes.service.ts (préoccupations mixtes)
│   ├── final-tests.controller.ts (séparé mais couplé)
│   └── quizzes.utils.ts (logique partagée)
├── certificates/      ⚠️ Tightly coupled quizzes
├── notifications/     ⚠️ Service locator pattern (imports 4+ modules)
├── collections/       ✅ Isolé
├── resources/         ✅ Bien-scoped
├── email/             ✅ Bien-scoped
└── database/          ⚠️ Logique seed mélangée avec execution
```

**Carte Couplage Module:**
```
QuizzesService
  └─> CertificatesService
  └─> ProgressService
  └─> CourseService (bidirectionnel)
NotificationsService
  └─> CourseService
  └─> ResourcesService
  └─> CertificatesService
```

### 1.2 Problèmes Niveau Service (Détail)

#### Problème 1: QuizzesService est un Objet Dieu
**Fichier:** `backend/src/quizzes/quizzes.service.ts`  
**Problème:** 887 lignes mélangeant 4 préoccupations distinctes

**Breakdown Lignes:**
- Lignes 1-130: Définitions types (65 lignes) → Devrait être fichier séparé
- Lignes 131-300: Opérations CRUD Quiz (170 lignes)
- Lignes 301-500: Évaluation tentative quiz (200 lignes)
- Lignes 501-700: Récupération/transformation quiz (200 lignes)
- Lignes 701-887: Logique sync certificat (187 lignes) → **Dépendance circulaire**

**Problèmes Couplage Spécifiques:**
```typescript
// Ligne ~160: Dépendance directe NotificationsService
constructor(
  private readonly certificatesService: CertificatesService,
  @InjectRepository(...) // 8 repositories injected directement
)

// Problème: Quand user passe final test, service quizzes appelle certificatesService
// Mais certificatesService aussi importe service quizzes pour validation
// Crée dépendance circulaire cachée via exports module
```

**Ce Qui Devrait Être Splitter:**
1. **QuizManagementService** - Opérations CRUD définitions quiz
2. **QuizAttemptService** - Soumission tentative, scoring, évaluation
3. **QuizQueryService** - Requêtes heavy-read avec transformations
4. Logique sync certificat devrait bouger à **CertificateProgressService**

**Avant/Après Structure:**
```typescript
// AVANT: Service unique 887 lignes
export class QuizzesService {
  async upsertChapterQuiz(courseId, chapterId, dto) { /* 50 lignes */ }
  async submitChapterQuizAttempt(courseId, chapterId, userId, dto) { /* 80 lignes */ }
  async getChapterQuiz(courseId, chapterId, currentUser) { /* 40 lignes */ }
  async syncCourseCertificate(userId, courseId) { /* 100 lignes */ }
  // ... 700 lignes encore
}

// APRÈS: Services séparés avec responsabilités claires
export class QuizManagementService {
  async upsertChapterQuiz(courseId, chapterId, dto) { /* 50 lignes */ }
  async deleteChapterQuiz(courseId, chapterId) { /* 20 lignes */ }
}

export class QuizAttemptService {
  async submitChapterQuizAttempt(courseId, chapterId, userId, dto) { /* 80 lignes */ }
  // Évalue, sauvegarde, trigger sync certificat
}

export class QuizQueryService {
  async getChapterQuizForAdmin(chapterId) { /* 40 lignes */ }
  async getChapterQuizForLearner(chapterId, userId) { /* 35 lignes */ }
}
```

---

#### Problème 2: NotificationsService avec Logique Métier Mixte
**Fichier:** `backend/src/notifications/notifications.service.ts` (386 lignes)  
**Problème:** Mélange types notifications, filtering logique complexe, pas de patterns CQRS

**Divisions Recommandées:**
1. **NotificationQueryService** - Requêtes lecture, filtrage utilisateur
2. **NotificationWriteService** - Création, mise à jour, suppression
3. **NotificationEventListeners** - Réagit à events (course.published, certificate.issued, etc.)

**Avant:**
```typescript
export class NotificationsService {
  async listMyNotifications() { /* 30 lignes */ }
  async markAsRead() { /* 20 lignes */ }
  async deleteNotification() { /* 15 lignes */ }
  async notifyCoursePublished() { /* 40 lignes */ }
  async notifyCertificateIssued() { /* 40 lignes */ }
  async notifyUserJoinedCourse() { /* 30 lignes */ }
  // ... 200+ lignes duplication logique filtering
}
```

**Après:**
```typescript
@Injectable()
export class NotificationQueryService {
  async listMyNotifications(userId, filters) { /* 30 lignes */ }
  async getNotificationStats(userId) { /* 15 lignes */ }
}

@Injectable()
export class NotificationWriteService {
  async markAsRead(notificationId) { /* 20 lignes */ }
  async deleteNotification(notificationId) { /* 15 lignes */ }
}

// Dans notifications.listeners.ts
@EventListener()
async onCoursePublished(event: CoursePublishedEvent) {
  // Créer notifications pour utilisateurs pertinents
}

@EventListener()
async onCertificateIssued(event: CertificateIssuedEvent) {
  // Envoyer email + créer notification
}
```

---

### 1.3 Issues Frontend

#### Duplication Composants
**5 Formulaires Identiques:**
- Register.tsx
- ChangePassword.tsx
- ForgotPassword.tsx
- CourseCreate.tsx
- ResourceUpload.tsx

**Pattern Partagé (50 lignes chaque):**
```typescript
// Duplicated everywhere:
const [formData, setFormData] = useState({ email: '', password: '' });
const [errors, setErrors] = useState({});
const [loading, setLoading] = useState(false);

useEffect(() => {
  // validation logic
}, [formData]);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await submitForm(formData);
    // success
  } catch (err) {
    setErrors(err);
  } finally {
    setLoading(false);
  }
};
```

**Estimation Duplication:** 250+ lignes

**Solution:**
```typescript
// FormContainer.tsx - réutilisable
export function FormContainer({ 
  fields, 
  onSubmit, 
  title 
}) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  // All shared logic here
  
  return (/* render form */)
}

// Usage:
<FormContainer
  fields={[
    { name: 'email', type: 'email', required: true },
    { name: 'password', type: 'password', required: true }
  ]}
  onSubmit={handleRegister}
  title="Inscription"
/>
```

---

#### Problèmes Gestion État Frontend
**Stores Zustand Actuels:**
- authStore ✅
- modalStore ✅

**Manquent:**
- courseStore ❌ (chaque page refait fetch)
- uiStore ❌ (theme, notifications, alerts)
- preferencesStore ❌ (language, notifications settings)
- notificationStore ❌ (messages temps réel)

**Impact:** Chaque composant refait ses propres fetches → requêtes dupliquées, état désynchronisé

---

### 1.4 Problèmes CSS

**73 Fichiers CSS Actuels:**
- Pas design tokens centralisés
- Couleurs hard-codées (#FF6B6B, rgb(100,200,50))
- Spacing inconsistent (8px, 12px, 16px, 20px mélangés)
- Media queries répétées 20+ fois

**Après Centralisation:**
```css
/* tokens.css - 50 lignes */
:root {
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  --color-primary: #667eea;
  --color-primary-dark: #764ba2;
  --color-success: #48bb78;
  --color-error: #f56565;
  
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
  
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.12);
  --shadow-md: 0 2px 4px rgba(0,0,0,0.1);
  --shadow-lg: 0 4px 8px rgba(0,0,0,0.15);
  
  --bp-tablet: 768px;
  --bp-desktop: 1024px;
}
```

**73 fichiers → 15 fichiers + 1 tokens.css = 67% réduction**

---

## 2. TIMELINE REFACTORISATION - 12 SEMAINES

### Phase 1 (Semaines 1-2): Services Foundation
```
⏱️ 60 heures
✅ Split QuizzesService (3 services)
✅ Créer QueryService abstraite
✅ Ajouter 4 indexes database
✅ Créer FormContainer component
✅ Setup Event Emitter architecture
```

### Phase 2 (Semaines 2-3): UI System Frontend
```
⏱️ 50 heures
✅ Créer design-tokens.css
✅ Extraire composants partagés (Form, Modal, Table)
✅ Créer useDataFetch hook réutilisable
✅ Consolidate store management
```

### Phase 3 (Semaines 4-5): Data Layer
```
⏱️ 70 heures
✅ Repository Pattern abstrait
✅ QueryBuilder implementation
✅ TypeORM migrations setup
✅ Test factories créées
```

### Phase 4 (Semaines 6-8): Service Refactoring
```
⏱️ 90 heures
✅ Event-driven architecture complet
✅ Split CoursesService, CertificatesService
✅ Query Service Pattern (read vs write)
✅ Integration tests
```

### Phase 5 (Semaines 8-9): State Management
```
⏱️ 40 heures
✅ Créer stores manquants
✅ Context synchronization
✅ Performance optimization
```

### Phase 6 (Semaines 10-11): Testing & Docs
```
⏱️ 60 heures
✅ Integration test coverage
✅ E2E scenarios
✅ Performance tests
✅ Documentation mise à jour
```

### Phase 7 (Semaine 12): Deploy & Optimize
```
⏱️ 30 heures
✅ Performance audit
✅ Deployment strategy
✅ Monitoring setup
```

**TOTAL: 400 heures = 10 semaines 1 dev senior + 2 semaines pair programming**

---

## 3. STRATÉGIE PHASE 1 (PROCHAINES 2 SEMAINES)

### Quick Wins Cette Semaine:

| Fix | Temps | Impact |
|-----|-------|--------|
| Ajouter 4 indexes DB | 2h | +60% perfs 🚀 |
| Créer tokens.css | 4h | UI cohérente |
| FormContainer shared | 6h | -250 lignes |
| useDataFetch hook | 4h | -8 copies code |
| Retirer console.logs | 1h | Code propre |
| **TOTAL** | **17h** | **Énorme impact** |

### Semaine Suivante: Service Architecture
- Setup @nestjs/event-emitter
- Créer EventListener pattern
- Splitter QuizzesService
- 20 integration tests

---

## 4. MÉTRIQUES SUCCÈS

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| Taille service max | 887L | 240L | 73% ↓ |
| Duplication CSS | 73 fichiers | 15 + tokens | 67% ↓ |
| Queries par request | 30-40 | ~2 | 95% ↓ |
| Test coverage backend | 13% | 35% | 170% ↑ |
| Code duplication | 20% | <5% | 75% ↓ |
| Build time | 15s | 12s | 20% ↓ |
| Maintenance cost | High | Low | -40% |

---

## 5. RISQUES & MITIGATION

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|-----------|
| Circular dependencies lors Event setup | 🟡 Medium | 🔴 High | Branch feature, tests CI/CD stricts |
| Breaking changes API Quiz endpoints | 🟡 Medium | 🔴 High | Feature flags, gradual rollout |
| Regression tests manqués | 🟡 Medium | 🟡 Medium | Integration tests before deploy |
| Performance regression | 🟢 Low | 🟡 Medium | Load testing each phase |
| Team alignment | 🟢 Low | 🟡 Medium | Daily standups, PRs reviews |

---

**Prochaines Étapes:**
1. Lire GUIDE_IMPLEMENTATION_PHASE_1.md pour detailing actions
2. Créer feature branch `refactoring/phase-1`
3. Commencer avec quick wins cette semaine
4. Weekly team syncs pour progress tracking
