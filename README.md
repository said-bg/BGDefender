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

Your `backend/.env` for local should be:

```env
NODE_ENV=development
PORT=3001

# Database connection (Docker will create this)
DATABASE_HOST=db
DATABASE_PORT=3306
DATABASE_USERNAME=bg_user
DATABASE_PASSWORD=bg_password
DATABASE_NAME=bg_defender

# Security
JWT_SECRET=dev-key
JWT_EXPIRES_IN=1d

# Allow frontend to connect
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Pre-load demo data (users + courses)
SEED_ON_BOOT=true
```

### Step 2b: Setup Frontend Environment (Local Dev Only)

```bash
cd frontend
copy .env.example .env.local
```

Your `frontend/.env.local` for local dev:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**Note:** In production, this is not needed. Frontend will connect to backend using the same domain.

### Step 3: Start Everything with Docker

**First time ONLY** (clean database):
```bash
docker compose down -v
```

**Then start:**
```bash
docker compose up -d
```

Logs will show:
```
[SEED] Created user "admin@bgdefender.com"
[SEED] Users seeding completed successfully
[SEED] Creating hierarchy for "FEZ"...
[MAIN] Server started on port 3001
```

### Step 4: Access Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api
- **Admin Panel:** http://localhost:3000/admin

**Login credentials (auto-created by seeds):**
- Email: `admin@bgdefender.com`
- Password: `Admin123!`

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

### Step 1: Prepare Backend for Production

Create `backend/.env` for production (copy from `.env.example` and change values):

```env
NODE_ENV=production
PORT=3001

# Your production database details
DATABASE_HOST=your-mysql-server.com
DATABASE_PORT=3306
DATABASE_USERNAME=secure_user
DATABASE_PASSWORD=SECURE_PASSWORD_HERE
DATABASE_NAME=bg_defender_prod

# Security (change this!)
JWT_SECRET=create-a-long-random-string-at-least-32-characters
JWT_EXPIRES_IN=7d

# Production URLs
FRONTEND_URL=https://academy.bg.fi
CORS_ORIGIN=https://academy.bg.fi

# First deploy: load demo data
# After: change to false
SEED_ON_BOOT=true
```

**Note:** Frontend doesn't need `.env.prod` - same config works everywhere. Frontend reads URLs from backend.

### Step 2: Build Productions Apps

```bash
# Frontend build
cd frontend
npm run build
# Creates: .next/ directory (ready for production)

# Backend build
cd backend
npm run build
# Creates: dist/ directory (ready for production)
```

### Step 3: First Production Deploy

```bash
# With SEED_ON_BOOT=true in backend/.env
docker compose up -d

# Check logs
docker logs bgdefender-backend
```

Wait for: `[SEED] ... completed successfully`

### Step 4: Verify It Works

Visit: https://academy.bg.fi
Login: `admin@bgdefender.com` / `Admin123!`

Verify:
- ✅ Can see demo courses
- ✅ Admin panel accessible
- ✅ Can browse collection

### Step 5: Disable Seeds & Secure

Edit `backend/.env`:
```env
SEED_ON_BOOT=false
```

Restart:
```bash
docker compose up -d
```

Now:
- ✅ App is live with demo data
- ✅ Seeds won't run again
- ✅ Your data is permanent
- ✅ Admin can add more courses

---

## 📋 Important Notes

### `docker-compose.yml` File
**DO NOT CHANGE** unless you know what you're doing. It defines:
- Frontend container
- Backend container  
- MySQL container
- How they talk to each other

### Environment Files (`.env`)

**Backend (.env):**
- **`backend/.env.example`** = Template (read-only, don't edit)
- **`backend/.env`** = Your actual config (created by you, git-ignored)
- Copy `.env.example` → `.env` and change values
- **REQUIRED for both local & production**

**Frontend (.env.local):**
- **`frontend/.env.example`** = Template (read-only, don't edit)
- **`frontend/.env.local`** = Only for **local dev** (points to localhost:3001)
- **NOT NEEDED in production** (frontend connects to same domain)
- Copy `.env.example` → `.env.local` for local dev only

### npm install vs Docker
**Order matters:**
1. `npm install` FIRST (installs Node packages locally)
2. `docker compose up` SECOND (runs containers with those packages)

### Commands Reference

```bash
# Start everything
docker compose up -d

# Stop everything
docker compose down

# View logs
docker compose logs -f

# Stop & delete database (fresh start)
docker compose down -v

# Backend logs only
docker logs bgdefender-backend -f
```

---

## ✅ Deployment Checklist

- [ ] `npm install` completed
- [ ] `backend/.env` created with production values
- [ ] `npm run build` succeeded (both frontend + backend)
- [ ] `docker compose up -d` started successfully
- [ ] Logs show `[SEED] ... completed successfully`
- [ ] Can login at https://academy.bg.fi
- [ ] Changed `SEED_ON_BOOT=false` after first verification
- [ ] Restarted: `docker compose up -d`

---

**Questions?** Contact dev team.
