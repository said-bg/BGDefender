# BG Defender

An online learning platform designed for creators to build, manage, and monetize courses. BG Defender provides a complete ecosystem for course creation, student management, and content delivery.

## Setup

1. Copy `.env.example` to `.env`
2. Install dependencies
3. Start the backend and frontend workspaces

```bash
npm install
npm run start
```

## Environment

The backend expects these variables at minimum:

- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`
- `JWT_SECRET`

Useful optional variables:

- `DATABASE_HOST`
- `DATABASE_PORT`
- `PORT`
- `FRONTEND_URL`
- `CORS_ORIGIN`
- `SEED_ON_BOOT`
- `LOG_RESET_TOKENS`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `NEXT_PUBLIC_API_URL`

## Scripts

- `npm run start`: run backend and frontend in dev mode
- `npm run build`: build both workspaces
- `npm run lint`: lint backend and frontend
- `npm run test`: run backend and frontend unit tests
- `npm run test:e2e`: run frontend Playwright tests
- `npm run test:all`: lint + unit tests + e2e

## Notes

- Course seeding runs only in development by default.
- Reset tokens are not logged unless `LOG_RESET_TOKENS=true`.
- Before production deployment, keep environment secrets outside the repository and use explicit database migrations.
