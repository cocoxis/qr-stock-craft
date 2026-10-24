#!/bin/bash
# StockQR on Unraid (or any Docker host) without Docker Compose.
#
#   mkdir -p /mnt/user/appdata/stockqr && cd /mnt/user/appdata/stockqr
#   wget -O stockqr.sh https://raw.githubusercontent.com/cocoxis/qr-stock-craft/main/deploy/stockqr.sh
#   bash stockqr.sh            first run: creates stockqr.env, edit it, then run again
#   bash stockqr.sh            install, or update to the latest image (data is kept)
#   bash stockqr.sh logs       follow the app logs
#   bash stockqr.sh stop       stop and remove the containers (data is kept)
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG="$DIR/stockqr.env"
NETWORK=stockqr
IMAGE_APP=ghcr.io/cocoxis/qr-stock-craft:latest
IMAGE_DB=postgres:17-alpine
IMAGE_REST=postgrest/postgrest:v12.2.3
ICON=https://raw.githubusercontent.com/cocoxis/qr-stock-craft/main/public/favicon.svg

case "${1:-}" in
  logs) exec docker logs -f stockqr-app ;;
  stop) docker rm -f stockqr-app stockqr-rest stockqr-db 2>/dev/null || true; echo "Stopped. Data is still in $DIR"; exit 0 ;;
esac

# ── Settings ────────────────────────────────────────────────
if [ ! -f "$CONFIG" ]; then
  cat > "$CONFIG" <<EOF
# StockQR settings. Edit, then run: bash stockqr.sh
DB_PASSWORD=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
PORT=8085

# Supabase project used as backup (and to fill the database on first start). Leave empty for local files only.
BACKUP_SUPABASE_URL=https://your-project-ref.supabase.co
BACKUP_SUPABASE_KEY=sb_publishable_...

BACKUP_INTERVAL_HOURS=6
BACKUP_KEEP=30
EOF
  echo "Created $CONFIG"
  echo "Edit it (nano $CONFIG): set BACKUP_SUPABASE_URL and BACKUP_SUPABASE_KEY, then run: bash $0"
  exit 0
fi

# shellcheck disable=SC1090
source "$CONFIG"
if [[ "${BACKUP_SUPABASE_URL:-}" == *your-project-ref* || "${BACKUP_SUPABASE_KEY:-}" == *... ]]; then
  echo "Set BACKUP_SUPABASE_URL and BACKUP_SUPABASE_KEY in $CONFIG (or empty them for local backups only)."
  exit 1
fi
if [[ ! "$DB_PASSWORD" =~ ^[A-Za-z0-9]+$ ]]; then
  echo "DB_PASSWORD must contain letters and digits only."
  exit 1
fi

# ── Containers ──────────────────────────────────────────────
echo "Pulling images…"
docker pull -q "$IMAGE_DB" > /dev/null
docker pull -q "$IMAGE_REST" > /dev/null
docker pull -q "$IMAGE_APP" > /dev/null

docker network inspect "$NETWORK" > /dev/null 2>&1 || docker network create "$NETWORK" > /dev/null
docker rm -f stockqr-app stockqr-rest stockqr-db > /dev/null 2>&1 || true
mkdir -p "$DIR/db" "$DIR/backups"

docker run -d --name stockqr-db --network "$NETWORK" --restart unless-stopped \
  -e POSTGRES_DB=stockqr -e POSTGRES_USER=stockqr -e POSTGRES_PASSWORD="$DB_PASSWORD" \
  -v "$DIR/db:/var/lib/postgresql/data" \
  --label net.unraid.docker.icon="$ICON" \
  "$IMAGE_DB" > /dev/null

docker run -d --name stockqr-rest --network "$NETWORK" --restart unless-stopped \
  -e PGRST_DB_URI="postgres://authenticator:$DB_PASSWORD@stockqr-db:5432/stockqr" \
  -e PGRST_DB_SCHEMAS=public -e PGRST_DB_ANON_ROLE=anon -e PGRST_OPENAPI_MODE=disabled \
  --label net.unraid.docker.icon="$ICON" \
  "$IMAGE_REST" > /dev/null

docker run -d --name stockqr-app --network "$NETWORK" --restart unless-stopped \
  -p "$PORT:8080" \
  -e DATABASE_URL="postgres://stockqr:$DB_PASSWORD@stockqr-db:5432/stockqr" \
  -e AUTHENTICATOR_PASSWORD="$DB_PASSWORD" \
  -e POSTGREST_URL=http://stockqr-rest:3000 \
  -e BACKUP_SUPABASE_URL="${BACKUP_SUPABASE_URL:-}" \
  -e BACKUP_SUPABASE_KEY="${BACKUP_SUPABASE_KEY:-}" \
  -e BACKUP_INTERVAL_HOURS="${BACKUP_INTERVAL_HOURS:-6}" \
  -e BACKUP_KEEP="${BACKUP_KEEP:-30}" \
  -v "$DIR/backups:/backups" \
  --label net.unraid.docker.icon="$ICON" \
  --label net.unraid.docker.webui="http://[IP]:[PORT:8080]/" \
  "$IMAGE_APP" > /dev/null


echo "StockQR is starting on port $PORT. Logs: bash $0 logs"
