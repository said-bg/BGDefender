# BG Academy - Full Stack Learning Platform

A cybersecurity course management platform for creating, managing, and delivering online courses.

## 🛠 Tech Stack Explained

### Frontend: Next.js 16 + React 19 + TypeScript

**What is Next.js?**
- Building framework on top of React
- **SSR (Server-Side Rendering):** Server generates HTML before sending to browser → better SEO, faster first load
- **SSG (Static Site Generation):** Pre-build pages at deploy time → super fast, no server needed
- **Automatic Routing:** Create file in `pages/` → route exists (no manual config)
- **Turbopack:** Lightning-fast build system (2.5s instead of 30s)

**Why use it?** Fast, SEO-friendly, easy to deploy.

**TypeScript:** Catches errors at build time (before prod). Types are your safety net.

**React 19:** Modern UI library with hooks (functions instead of classes). Easier to understand and maintain.

### Backend: NestJS 11 + TypeORM + TypeScript

**What is NestJS?**
- Structured framework for building APIs (like Django/Flask but for Node.js)
- Modular: organize code in modules (auth module, courses module, etc)
- Built-in validation: NestJS checks if data is valid before processing
- Easy testing: clear structure makes unit tests simple

**TypeORM:** Database helper that writes SQL for you. Instead of manual SQL:
```sql
SELECT * FROM users WHERE email = 'admin@bgdefender.com'
```
You write:
```typescript
userRepository.findOne({ where: { email: 'admin@bgdefender.com' } })
```
Cleaner, safer, auto-migration support.

**TypeScript:** Same as frontend - catches bugs early.

### Database: MySQL 8.0

Enterprise-grade, reliable, standard for web apps. Uses ACID transactions (data never corrupts).

### Docker & Docker Compose

**Docker:** Package app + dependencies as container. Same everywhere (your laptop = production server).

**Docker Compose:** Run multiple containers together:
- Frontend container (Next.js)
- Backend container (NestJS)
- Database container (MySQL)

One command: `docker compose up` → everything runs.

### Testing: Jest + Playwright

- **Jest:** Automated tests for backend code (make sure functions work)
- **Playwright:** Automated tests for frontend (make sure UI works end-to-end)

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js 18+** with npm
- **Docker Desktop** (includes Docker Compose)
- **Git**

### Step 1: Clone & Install Node Packages

```bash
git clone <your-repo>
cd bg-defender

# Install ALL dependencies (for backend + frontend)
# This is REQUIRED before Docker!
npm install
```

### Step 2: Setup Backend Environment

```bash
cd backend
copy .env.example .env
```

Edit `backend/.env` (for local dev, use these values):

```env
NODE_ENV=development
PORT=3001

DATABASE_HOST=XXX_CHANGE_ME_server_host_XXX
DATABASE_PORT=3306
DATABASE_USERNAME=XXX_CHANGE_ME_username_XXX
DATABASE_PASSWORD=XXX_CHANGE_ME_strong_password_XXX
DATABASE_NAME=XXX_CHANGE_ME_database_name_XXX

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000

# SEED_ON_BOOT=true: Loads test data on startup (development)
# SEED_ON_BOOT=false: Keeps existing data (production)
SEED_ON_BOOT=true

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
SMTP_SECURE=false

```

### Step 2b: Setup Frontend Environment

```bash
cd frontend
copy .env.example .env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

(Only needed for local dev - not in production)

### Step 3: Start Everything with Docker

**First time ONLY** (clean database):
```bash
docker compose down -v
```

**Start Docker containers (database + backend API):**
```bash
docker compose up -d
```

### Step 4: Start Frontend Dev Server

```bash
npm run start
```

This starts the frontend on `http://localhost:3000` and automatically connects to the backend running in Docker.

---

## 🌱 What are Seeds?

**Seeds:** Scripts that automatically fill the database with demo data on first startup.

**Why?**
- First time you open the app, it shows actual courses + users
- Admin can see it working immediately
- You don't have to manually create everything

**What gets created:**
- 3 users: admin, free user, premium user
- 8 courses: FEZ, Penetration Testing, etc (each with chapters, quizzes, content)

**Is it safe?**
- ✅ Yes! Seeds only create data that doesn't exist
- ✅ Your own data is never touched
- ✅ Can be disabled later (set `SEED_ON_BOOT=false`)

---

## 🚀 Production Deployment

### Step 1: Update Backend Environment

Copy `.env.production` to `.env` and update with production values:

```bash
cd backend
copy .env.production .env
```

Edit `backend/.env` (replace XXX_CHANGE_ME values):

```env
NODE_ENV=production
PORT=3001

DATABASE_HOST=XXX_CHANGE_ME_server_host_XXX
DATABASE_PORT=3306
DATABASE_USERNAME=XXX_CHANGE_ME_username_XXX
DATABASE_PASSWORD=XXX_CHANGE_ME_strong_password_XXX
DATABASE_NAME=XXX_CHANGE_ME_database_name_XXX

JWT_SECRET=XXX_CHANGE_ME_64_RANDOM_CHARACTERS_XXX
FRONTEND_URL=https://academy.bg.fi
CORS_ORIGIN=https://academy.bg.fi

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=XXX_CHANGE_ME_email@gmail.com_XXX
SMTP_PASS=XXX_CHANGE_ME_app_password_XXX
SMTP_FROM=XXX_CHANGE_ME_email@gmail.com_XXX
SMTP_SECURE=false

# ============================================================
# SEED_ON_BOOT Configuration
# ============================================================
# SEED_ON_BOOT=true (First deployment ONLY)
#   → On first startup in production: seeds execute
#   → Example data loads (courses, chapters, quizzes, etc)
#   → Users see example courses
#
# AFTER first startup, CHANGE TO:
#   SEED_ON_BOOT=false
#   → Seeds NEVER execute again
#   → Real user data stays safe
#   → Prevents accidental data reset
# ============================================================
SEED_ON_BOOT=true
```

### Step 2: Build Both Apps

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run build
```

### Step 3: Deploy with Docker

```bash
docker compose up -d

# Check logs
docker logs bgdefender-backend
```

### Step 4: Verify

Visit: `https://academy.bg.fi`
Login: `admin@bgdefender.com` / `Admin123!`

Check:
- ✅ Demo courses visible
- ✅ Admin panel works
- ✅ Can browse collections

### Step 5: Disable Seeds

Edit `backend/.env`:
```env
SEED_ON_BOOT=false
```

Restart:
```bash
docker compose down -v and restart : docker compose up -d
```

Done! Seeds won't run again and data is permanent.

---

### Quick Commands

```bash
# Start Docker (database + backend)
docker compose up -d

# Start frontend dev server
npm run start

# Stop everything
docker compose down

# Fresh start (delete database)
docker compose down -v

# See backend logs
docker logs bgdefender-backend -f

# See all logs
docker compose logs -f
```

---

**Questions?** Contact dev team.
