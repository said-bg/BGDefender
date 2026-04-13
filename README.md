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

Wait for logs to show:
```
[SEED] Created user "admin@bgdefender.com"
[SEED] Users seeding completed successfully
[SEED] Creating hierarchy for "FEZ"...
[MAIN] Server started on port 3001
```

### Step 4: Start Frontend Dev Server

```bash
npm run start
```

This starts the frontend on `http://localhost:3000` and automatically connects to the backend running in Docker.

### Step 5: Access Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api
- **Admin Panel:** http://localhost:3000/admin

**Login:**
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

### Step 1: Update Backend Environment

Copy `.env.example` to `.env` and update with production values:

```bash
cd backend
copy .env.example .env
```

Edit `backend/.env` (replace XXX_CHANGE_ME values):

```env
NODE_ENV=production
PORT=3001

DATABASE_HOST=XXX_CHANGE_ME_your_mysql_server_XXX
DATABASE_PORT=3306
DATABASE_USERNAME=XXX_CHANGE_ME_secure_user_XXX
DATABASE_PASSWORD=XXX_CHANGE_ME_strong_password_XXX
DATABASE_NAME=XXX_CHANGE_ME_database_name_XXX

JWT_SECRET=replace_with_a_long_random_secret_at_least_32_chars
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://academy.bg.fi
CORS_ORIGIN=https://academy.bg.fi

# First deploy ONLY - load demo data
# Change to false after verification
SEED_ON_BOOT=true

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
SMTP_SECURE=false
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

Wait for: `[SEED] ... completed successfully`

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
docker compose up -d
```

Done! Seeds won't run again and data is permanent.

---

## 📋 Important Notes

### Security: `.env` vs `.env.example`

**`.env.example`** = Safe to share (template with placeholders)
- Send this to client via email/GitHub
- Contains: `XXX_CHANGE_ME_*`, `your_email@gmail.com`, `replace_with_*`
- No actual secrets

**`.env`** = NEVER share (your actual secrets)
- Stay in `.gitignore` (not on GitHub)
- Contains: real passwords, real database credentials, real API keys
- Keep private, only share if client really needs it (secure channel)

When client deploys:
1. Client gets `.env.example` from GitHub
2. Client copies to `.env`
3. Client fills in their own values (XXX_CHANGE_ME_* → actual data)
4. Client NEVER commits `.env` to version control

### `docker-compose.yml`
Don't touch this unless you know what you're doing. It defines:
- Frontend container
- Backend container  
- MySQL container
- How they connect

### Environment Files

**Backend:**
- `.env.example` = template (safe to share)
- `.env` = your config (NEVER share, .gitignored)
- Copy `.env.example` → `.env` and fill with your values

**Frontend:**
- `.env.example` = template (safe to share)
- `.env.local` = local dev only (not needed in production, .gitignored)
- Copy `.env.example` → `.env.local` for local dev

### Order Matters
1. `npm install` first
2. `docker compose up -d` second
3. `npm run start` third

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
