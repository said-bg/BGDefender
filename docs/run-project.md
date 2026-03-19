# 🚀 Lancer BG Defender (après installation)

## Quick Start (3 terminaux)

```bash
# Terminal 1 - Database
docker-compose up

# Terminal 2 - Backend
cd backend
npm run start:dev

# Terminal 3 - Frontend
cd frontend
npm run dev
```

## Vérifier

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Database: localhost:3306

---

## Alternative: Lancer les deux depuis la racine

Si tu as concurrently installé à la racine:
```bash
# Terminal 1 - Database
docker-compose up

# Terminal 2 - Backend + Frontend
npm start
```

---

## Logs à vérifier

✅ Backend doit afficher:
```
[Nest] xxxx - xx/xx/xxxx xx:xx:xx     LOG [NestFactory] Starting Nest application...
[Nest] xxxx - xx/xx/xxxx xx:xx:xx     LOG [NestApplication] Nest application successfully started
```

✅ Frontend doit afficher:
```
  ▲ Next.js 16.2.0
  ➜ Local: http://localhost:3000
```

✅ Database doit afficher:
```
Ready for connections
```

---

Voir [setup.md](setup.md) pour l'installation complète.
