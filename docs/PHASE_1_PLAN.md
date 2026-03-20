# SPRINT 1 — Fondations Backend + Authentification (Semaines 1-2)

## Objectif
Créer une infrastructure backend solide avec authentification sécurisée, règles métier verrouillées, et frontend login/register fonctionnel.

---

## SEMAINE 1: FONDATIONS TECHNIQUES

### Jour 1: TypeORM Setup + Configuration DB

**Fichiers à créer/modifier:**
- `backend/src/config/database.config.ts` — Configuration TypeORM centralisée
- `backend/src/database/migrations/` — Structure de dossier pour futures migrations

**Étapes:**
1. Vérifier `.env` backend:
   ```
   DATABASE_HOST=localhost
   DATABASE_PORT=3307
   DATABASE_USERNAME=bguser
   DATABASE_PASSWORD=bg_user_2026
   DATABASE_NAME=bgdefender
   ```

2. Créer `database.config.ts` avec ConfigService (NestJS best practice):
   ```typescript
   import { Injectable } from '@nestjs/common';
   import { ConfigService } from '@nestjs/config';
   import { TypeOrmModuleOptions } from '@nestjs/typeorm';
   
   @Injectable()
   export class DatabaseConfig {
     constructor(private configService: ConfigService) {}
   
     getConfig(): TypeOrmModuleOptions {
       const isDev = this.configService.get('NODE_ENV') === 'development';
       return {
         type: 'mysql',
         host: this.configService.get('DATABASE_HOST'),
         port: this.configService.get('DATABASE_PORT'),
         username: this.configService.get('DATABASE_USERNAME'),
         password: this.configService.get('DATABASE_PASSWORD'),
         database: this.configService.get('DATABASE_NAME'),
         entities: [__dirname + '/../entities/**/*.entity{.ts,.js}'],
         synchronize: isDev, // JAMAIS true en production
         logging: isDev,
       };
     }
   }
   ```
   
   Dans `app.module.ts`:
   ```typescript
   TypeOrmModule.forRootAsync({
     useClass: DatabaseConfig,
   })
   ```

3. Configurer `app.module.ts`:
   ```typescript
   import { ConfigModule } from '@nestjs/config';
   
   @Module({
     imports: [
       ConfigModule.forRoot({
         isGlobal: true,
         envFilePath: '.env',
       }),
       TypeOrmModule.forRootAsync({
         useClass: DatabaseConfig,
       }),
     ],
   })
   ```

4. Test: `npm run start:dev` → vérifier connexion DB, pas d'erreurs

---

### Jour 2: User Entity (Lightweight)

**Fichier:**
- `backend/src/entities/user.entity.ts`

**Champs essentiels seulement:**
```typescript
@Column({ unique: true })
email: string; // La vraie clé unique

@Column()
password: string; // Hashé toujours

@Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
role: UserRole; // USER | CREATOR | ADMIN

@Column({ type: 'enum', enum: UserPlan, default: UserPlan.FREE })
plan: UserPlan; // FREE | PREMIUM

@Column({ default: true })
isActive: boolean; // Soft delete capability

@CreateDateColumn()
createdAt: Date;

@UpdateDateColumn()
updatedAt: Date;
```

**Pas d'autres champs pour Phase 1** (firstName/lastName/profile viennent plus tard).

**Enregistrer entity dans TypeOrmModule.**

Test: `npm run start:dev` → Table `user` créée automatiquement.

---

### Jour 3: Règles Métier de Sécurité (Hardcodées)

**Fichier:**
- `backend/src/constants/security.constants.ts`

```typescript
// Constantes de sécurité RÉELLEMENT UTILISÉES en Phase 1
export const SECURITY_RULES = {
  // Auth — ces constantes sont IMMÉDIATEMENT implémentées
  JWT_EXPIRES_IN: '1d',
  JWT_ALGORITHM: 'HS256',
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/, // Min 1 majuscule, 1 chiffre, 8 chars
  BCRYPT_ROUNDS: 10,
};

// Note: Les constantes suivantes sont PRÉPARÉES pour phases futures
// Ne pas les implémenter maintenant:
// - MAX_LOGIN_ATTEMPTS (Phase 2+)
// - LOCKOUT_DURATION_MS (Phase 2+)
// - ROLE_PERMISSIONS (Phase 2+)
// - PLAN_ACCESS (Phase 2+ — décidé dans guards à la place)
```

**Utiliser ces constantes partout** — pas de "magic strings".

---

### Jour 4: AuthService (Core Logic)

**Fichier:**
- `backend/src/auth/auth.service.ts`

**Méthodes essentielles:**

```typescript
// ⚠️ IMPORTANT: Deux comportements distincts, PAS d'auto-login après register

// Registration — retourne JUSTE l'user créé, PAS de token
async register(email: string, password: string): Promise<SafeUser> {
  // 1. Email validation + uniqueness (throw ConflictException si duplicate)
  // 2. Password validation (length ≥8, regex: min 1 uppercase + 1 digit)
  // 3. Hash password avec bcrypt SECURITY_RULES.BCRYPT_ROUNDS
  // 4. Créer user: { email, hashedPassword, plan=FREE, role=USER, isActive=true }
  // 5. Saveṛeturn user (JAMAIS password)
  // 6. Retourner SafeUser (voir type ci-dessous)
}

// Login — retourne token + user seulement
async login(email: string, password: string): Promise<{ accessToken: string; user: SafeUser }> {
  // 1. Trouver user par email (throw UnauthorizedException si absent)
  // 2. Vérifier isActive (throw UnauthorizedException si false)
  // 3. Comparer password avec bcrypt (throw UnauthorizedException si mismatch)
  // 4. Générer JWT avec payload: { id, email, role, plan }
  // 5. Return { accessToken, user: SafeUser } — JAMAIS user brut avec password
}

// Validate JWT — retourne user ou null
async validateUser(payload: JwtPayload): Promise<SafeUser | null> {
  // 1. Trouver user par id
  // 2. Si pas trouvé, return null (pas d'exception)
  // 3. Si inactif, return null
  // 4. Return SafeUser
}

// Type SafeUser — JAMAIS retourner password
type SafeUser = {
  id: number;
  email: string;
  role: UserRole; // USER
  plan: UserPlan; // FREE
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
```

**Utiliser SECURITY_RULES pour tous les validations.**

---

### Jour 5: AuthController + JWT Guard

**Fichiers:**
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/guards/jwt-auth.guard.ts`
- `backend/src/auth/strategies/jwt.strategy.ts`

**AuthController:**
```typescript
@Post('register')
async register(@Body() dto: RegisterDto): Promise<SafeUser> {
  // Retourne SEULEMENT l'user créé, PAS de token
  return this.authService.register(dto.email, dto.password);
}

@Post('login')
async login(@Body() dto: LoginDto): Promise<{ accessToken: string; user: SafeUser }> {
  // Retourne token + user (SafeUser sans password)
  return this.authService.login(dto.email, dto.password);
}

@UseGuards(JwtAuthGuard)
@Get('me')
me(@Req() req): SafeUser {
  return req.user as SafeUser; // Attaché par JWT Guard, JAMAIS password
}
```

**JWT Guard:**
- Extraire token du header Authorization: Bearer <token>
- Vérifier signature + expiration
- Appeler validateUser() pour vérifier user existe toujours
- Attacher user à req.user
- Throw UnauthorizedException si token invalide/absent

---

### Jour 6-7: Tests Unitaires (70% coverage)

**Tests AuthService:**
- ✅ register() avec email unique → crée user FREE
- ✅ register() avec email duplicate → ConflictException
- ✅ register() avec password faible → BadRequestException
- ✅ login() avec email/password correct → accessToken
- ✅ login() avec password incorrect → UnauthorizedException
- ✅ login() avec user inactif → UnauthorizedException
- ✅ validateUser() avec ID valide → user
- ✅ validateUser() avec ID invalide → null ou exception

**Tests Intégration (E2E):**
- ✅ POST /auth/register → 201, user créé, PAS de token retourné
- ✅ POST /auth/login → 200, token valide + user data (SafeUser)
- ✅ GET /auth/me sans token → 401
- ✅ GET /auth/me avec token valide → user data (SafeUser)
- ✅ GET /auth/me avec token expiré → 401

**Target: 70% coverage AuthService + 70% endpoints**

---

## SEMAINE 2: FRONTEND + E2E

### Jour 1: Login/Register Pages

**Fichiers:**
- `frontend/src/app/auth/register/page.tsx`
- `frontend/src/app/auth/login/page.tsx`
- `frontend/src/types/auth.ts` — Types TypeScript

**Register page:**
- Form: email, password, confirmPassword
- Validation client-side (email format, password strength, match)
- POST /auth/register
- Success → redirect /login (PAS de token, rien à sauvegarder)
- Error → afficher message (duplicate email, weak password)

**Login page:**
- Form: email, password
- Validation client-side
- POST /auth/login
- Success → save token + redirect /dashboard
- Error → afficher message clairs (email pas trouvé, password incorrect)

---

### Jour 2: Token Management + Axios

**Fichiers:**
- `frontend/src/lib/auth.ts` — Token utils
- `frontend/src/lib/axios-instance.ts` — Axios avec interceptor

**Auth utils:**
```typescript
export const saveToken = (token: string) => localStorage.setItem('token', token);
export const getToken = () => localStorage.getItem('token');
export const removeToken = () => localStorage.removeItem('token');
export const isAuthenticated = () => !!getToken();
```

**Axios interceptor:**
```typescript
// Request: ajouter Authorization header
// Response: si 401 → removeToken() + redirect /auth/login
```

---

### Jour 3: Protected Routes + /dashboard

**Fichiers:**
- `frontend/src/app/dashboard/page.tsx` — Protected page exemple

**Logic:**
- useEffect: appeler GET /auth/me
- Si 401 → redirect /auth/login
- Success → afficher user info

---

### Jour 4: UI + Styling

- Design login/register avec Tailwind (simple, responsive)
- Links entre pages (register ↔ login)
- Loading states, error messages clairs
- Logout button sur dashboard (removeToken + redirect)

---

### Jour 5-7: Manual E2E Testing

**Signup flow:**
1. Visit /auth/register
2. Remplir form (valid email, strong password)
3. Submit → vérifier user créé en DB
4. Redirect /auth/login (pas de token)
5. ✅ localStorage est vide (aucun token sauvé)

**Login flow:**
1. Visit /auth/login
2. Remplir form (registered email/password)
3. Submit → vérifier token sauvé en localStorage
4. Redirect /dashboard
5. Vérifier GET /auth/me fonctionne
6. Refresh page → token toujours accessible
7. Logout → token supprimé + redirect /auth/login

**Error cases:**
- Register email duplicate → conflict error
- Register weak password → validation error
- Login wrong password → unauthorized
- Access /dashboard sans token → 401 + redirect /auth/login

---

## LIVRABLES PHASE 1

### Backend
✅ TypeORM configured + DB connected
✅ User entity (lightweight, essentiels seulement)
✅ Security constants (hardcoded, utilisés partout)
✅ AuthService (register, login, validateUser)
✅ AuthController (register, login, /me protected)
✅ JWT Guard + Strategy
✅ Tests unitaires auth (70% coverage)
✅ Tests intégration endpoints (70% coverage)

### Frontend
✅ Register page + form
✅ Login page + form
✅ Token management (save/get/remove)
✅ Axios interceptor with Authorization header
✅ Protected /dashboard page
✅ Manual E2E tested workflow documented

### Git Workflow
✅ Créer branche: `git checkout -b feat/auth-foundations`
✅ Commit backend: "feat: backend foundations & auth (DB, entity, service, controller)"
✅ Commit frontend: "feat: frontend auth pages & token management"
✅ Push branche: `git push origin feat/auth-foundations`
✅ Créer PR pour review (même solo, valider ta propre logique)
✅ Merge à `main` seulement après validation

---

## Critères de Succès Phase 1

- ✅ Signup → user créé en DB avec plan FREE automatique
- ✅ Login → token JWT valide généré
- ✅ Token stocké → accessible après refresh
- ✅ Token dans Authorization header → GET /auth/me fonctionne
- ✅ Logout → token supprimé
- ✅ Erreurs claires (duplicate email, weak password, wrong credentials)
- ✅ Règles métier sécurité appliquées (pas de magic strings)
- ✅ Tests coverage ≥70% pour auth logic
- ✅ Code propre, lisible, maintenable

---

## Notes

- **Pas de firstName/lastName Phase 1** → trop lourd, add Phase 2
- **Pas d'email verification** → add Phase 2 si temps
- **Pas de password reset** → add Phase 2
- **All security rules in constants** → réutilisables, testables
- **TypeORM synchronize:true locally** → synchronize:false en production
- **1 jour = 8h travail** → ajuster selon réalité

