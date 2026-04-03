# Déploiement StockQR – NAS Ugreen (Docker)

## Prérequis
- Docker & Docker Compose installés sur le NAS

## Déploiement

```bash
# 1. Cloner / copier ce dossier sur le NAS
cd /chemin/vers/deploy

# 2. Configurer le mot de passe
cp .env.example .env
nano .env   # modifier DB_PASSWORD

# 3. Builder le frontend (depuis la racine du projet)
npm run build
# Copier le dossier dist/ dans deploy/dist/
cp -r ../dist ./dist

# 4. Lancer les services
docker compose up -d

# 5. Vérifier
curl http://localhost/api/stock_items   # → []
```

## Architecture

```
Port 80 (Nginx)
  ├── /          → Frontend React (SPA)
  └── /api/*     → PostgREST → PostgreSQL
```

## Mise à jour du frontend
```bash
npm run build
cp -r ../dist ./dist
docker compose restart web
```
