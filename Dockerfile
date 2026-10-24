# StockQR, self-hosted: the app, the LCSC lookup and the backups in one Bun process.
# The database (Postgres) and its API (PostgREST) run as separate containers, see deploy/docker-compose.yml.

FROM oven/bun:1.3-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
# No Supabase project baked in: the app talks to the server it is loaded from
RUN rm -f .env .env.* && bun run build

FROM oven/bun:1.3-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080 \
    BACKUP_DIR=/backups
COPY --from=build /app/dist ./dist
COPY server ./server
COPY supabase/setup.sql ./supabase/setup.sql
COPY supabase/migrations/20261024180000_lock_label_fields.sql ./supabase/migrations/
COPY supabase/functions/lcsc/handler.ts ./supabase/functions/lcsc/handler.ts
VOLUME /backups
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s \
  CMD wget -qO- http://127.0.0.1:8080/api/health > /dev/null || exit 1
CMD ["bun", "server/index.ts"]
