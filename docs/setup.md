# � Setup BG Defender

## Prérequis
- Node.js 18+
- Docker Desktop
- Git

---

## Installation (première fois)

### 1️⃣ Racine
```bash
npm install
```

### 2️⃣ Backend
```bash
cd backend
npm install @nestjs/config @nestjs/typeorm typeorm mysql2 class-validator class-transformer
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install -D @types/passport-jwt @types/bcrypt
cd ..
```

### 3️⃣ Frontend
```bash
cd frontend
npm install axios react-i18next i18next
cd ..
```

### 4️⃣ Racine (pour lancer back+front ensemble)
```bash
npm install concurrently
```

### 5️⃣ Environnement

Backend:
```bash
cp backend/.env.example backend/.env
```

Frontend:
```bash
cp frontend/.env.example frontend/.env
```

---

## Lancer le projet

**Terminal 1:**
```bash
docker-compose up
```

**Terminal 2:**
```bash
cd backend
npm run start:dev
```

**Terminal 3:**
```bash
cd frontend
npm run dev
```

---

## ✅ Vérifier

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Database: localhost:3306

---

## Ajouter d'autres packages

Si tu dois ajouter d'autres packages:

**Backend:**
```bash
cd backend
npm install <package-name>
cd ..
```

**Frontend:**
```bash
cd frontend
npm install <package-name>
cd ..
```

Puis fais un commit avec le package et puis git push! 👍

---

Voir [run-project.md](run-project.md) pour le quick start après.
