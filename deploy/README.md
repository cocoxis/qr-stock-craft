# Self-hosting StockQR (Unraid / Docker)

Three containers: **Postgres** (the data), **PostgREST** (the same REST API as Supabase) and the **StockQR app** (web app, LCSC lookup, backups). The app image is built by GitHub Actions on every push to `main`: `ghcr.io/cocoxis/qr-stock-craft:latest`.

```mermaid
flowchart LR
  B["Browser / phone"] -- ":8085" --> APP["app<br/>Bun server"]
  APP -- "/rest/v1" --> REST["rest<br/>PostgREST"]
  REST --> DB[("db<br/>Postgres 17")]
  APP -- "every 6 h" --> FILES["/backups<br/>JSON files"]
  APP -- "every 6 h" --> SB[("Supabase<br/>backup copy")]
  APP -- "LCSC lookup" --> LCSC["lcsc.com"]
```

## Install on Unraid

Unraid has Docker built in; the script below creates the three containers with plain `docker` commands (no Compose needed). Open the Unraid terminal (`>_` icon, top right) and run:

```sh
mkdir -p /mnt/user/appdata/stockqr && cd /mnt/user/appdata/stockqr
wget -O stockqr.sh https://raw.githubusercontent.com/cocoxis/qr-stock-craft/main/deploy/stockqr.sh
bash stockqr.sh
```

The first run creates `stockqr.env` with a random database password. Edit it (`nano stockqr.env`): set `BACKUP_SUPABASE_URL` and `BACKUP_SUPABASE_KEY` (Supabase → Project Settings → API, publishable key), or empty both to keep backups on the NAS only. Then run `bash stockqr.sh` again.

The containers `stockqr-db`, `stockqr-rest` and `stockqr-app` appear in the Docker tab; the app is at `http://<nas>:8085` (WebUI in the app's menu).

| Command | |
|---|---|
| `bash stockqr.sh` | Install, or update to the latest image (data is kept) |
| `bash stockqr.sh logs` | Follow the app logs |
| `bash stockqr.sh stop` | Remove the containers (data is kept) |

With Docker Compose instead (any Docker host, or the Compose plugin on Unraid): use [`docker-compose.yml`](docker-compose.yml) with [`.env.example`](.env.example) copied to `.env`.

On the first start the database is empty, so StockQR copies everything from the Supabase project. Watch it with `bash stockqr.sh logs`:

```text
Database schema ready
StockQR listening on :8080
[backup] Local database is empty: restoring from Supabase…
[backup]   stock_items: 135 rows restored
[backup] OK Saved 135 items to stockqr-….json and Supabase.
```

## Backups

Every `BACKUP_INTERVAL_HOURS` (6 by default) and at each start:

- a JSON file with all tables is written to `/mnt/user/appdata/stockqr/backups` (the last `BACKUP_KEEP` are kept);
- the Supabase project is updated to match the NAS: new and changed rows are copied, deleted rows are removed.

Safety: the Supabase copy is never wiped by an empty or half-empty NAS database. The mirror is skipped when the NAS has no parts, or less than half of what Supabase has, and it is disabled if the first-start restore failed.

Settings (gear icon at the bottom of the menu) → **Backups** shows the last backup and has a **Back up now** button.

## Update

The image is rebuilt by GitHub on every push. On the NAS: `bash stockqr.sh` (or `docker compose pull && docker compose up -d`). The database schema is updated automatically at start.

## Restore

- **From Supabase**: `bash stockqr.sh stop`, delete `/mnt/user/appdata/stockqr/db`, then `bash stockqr.sh`. The empty database is filled from Supabase.
- **From a backup file**: each file holds `{ "tables": { "stock_items": [...], ... } }`, rows in the same format as the API.

## Label printing

Printing still goes through the relay on the Windows PC the printer is plugged into (`bun run printer`). The browser calls it on `127.0.0.1`, so it works the same whether the app comes from `localhost` or from the NAS.

## Environment variables (app container)

| Variable | Default | |
|---|---|---|
| `DATABASE_URL` | | Postgres owner connection, used to create and update the schema |
| `AUTHENTICATOR_PASSWORD` | | Password given to the `authenticator` role that PostgREST uses |
| `POSTGREST_URL` | `http://rest:3000` | PostgREST inside the stack |
| `BACKUP_SUPABASE_URL` / `BACKUP_SUPABASE_KEY` | | Supabase project used as backup and first-start source |
| `BACKUP_INTERVAL_HOURS` | `6` | `0` disables scheduled backups |
| `BACKUP_KEEP` | `30` | Backup files kept |
| `BACKUP_DIR` | `/backups` | |
| `PORT` | `8080` | Port inside the container |
