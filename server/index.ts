/**
 * Self-hosted StockQR (Docker image).
 *
 *   /              the built app (dist/), single-page routing
 *   /rest/v1/*     PostgREST, same API as Supabase (the app uses supabase-js unchanged)
 *   /functions/v1/lcsc   LCSC part lookup (same code as the Supabase Edge Function)
 *   /api/health, /api/backup/status, POST /api/backup/run
 *
 * At start: creates/updates the database schema, restores an empty database from Supabase,
 * then backs up every BACKUP_INTERVAL_HOURS.
 */
import { SQL } from 'bun';
import { statSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { lcscHandler } from '../supabase/functions/lcsc/handler.ts';
import { restoreIfEmpty, runBackup, status as backupStatus, supabaseConfigured, waitForApi, type BackupConfig } from './backup.ts';

const env = (key: string, fallback = '') => process.env[key] || fallback;

const PORT = Number(env('PORT', '8080'));
const DIST = normalize(env('STATIC_DIR', join(import.meta.dir, '..', 'dist')));
const SQL_DIR = join(import.meta.dir, '..', 'supabase');
const DATABASE_URL = env('DATABASE_URL');
const AUTHENTICATOR_PASSWORD = env('AUTHENTICATOR_PASSWORD');
const BACKUP_HOURS = Number(env('BACKUP_INTERVAL_HOURS', '6'));

const backup: BackupConfig = {
  postgrest: env('POSTGREST_URL', 'http://rest:3000').replace(/\/$/, ''),
  dir: env('BACKUP_DIR', '/backups'),
  keep: Number(env('BACKUP_KEEP', '30')),
  supabaseUrl: env('BACKUP_SUPABASE_URL').replace(/\/$/, ''),
  supabaseKey: env('BACKUP_SUPABASE_KEY'),
};

const log = (...args: unknown[]) => console.log(`[${new Date().toISOString()}]`, ...args);
const sqlLiteral = (s: string) => `'${s.replace(/'/g, "''")}'`;

// ── Database schema ─────────────────────────────────────────

async function setupDatabase() {
  const sql = new SQL(DATABASE_URL);
  for (let attempt = 1; ; attempt++) {
    try {
      await sql`select 1`;
      break;
    } catch (err) {
      if (attempt >= 60) throw err;
      log('Waiting for the database…');
      await Bun.sleep(2000);
    }
  }
  // Roles used by PostgREST (Supabase has them built in)
  await sql.unsafe(`
    do $$ begin
      if not exists (select from pg_roles where rolname = 'anon') then create role anon nologin; end if;
      if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
      if not exists (select from pg_roles where rolname = 'authenticator') then create role authenticator noinherit login; end if;
    end $$;
    alter role authenticator with login password ${sqlLiteral(AUTHENTICATOR_PASSWORD)};
    grant anon, authenticated to authenticator;
  `);
  // Same scripts as a Supabase project; all of them can run again safely
  for (const file of ['setup.sql', 'migrations/20261024180000_lock_label_fields.sql']) {
    await sql.unsafe(await Bun.file(join(SQL_DIR, file)).text());
  }
  await sql.unsafe(`notify pgrst, 'reload schema'`);
  await sql.close();
  log('Database schema ready');
}

// ── HTTP ────────────────────────────────────────────────────

/** Forwards /rest/v1/* to PostgREST. Supabase auth headers are dropped: everything runs as the anon role. */
async function proxyRest(req: Request, url: URL): Promise<Response> {
  const headers = new Headers(req.headers);
  for (const h of ['authorization', 'apikey', 'host', 'x-client-info', 'connection', 'accept-encoding']) headers.delete(h);
  const res = await fetch(`${backup.postgrest}${url.pathname.slice('/rest/v1'.length) || '/'}${url.search}`, {
    method: req.method,
    headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer(),
  });
  const out = new Headers(res.headers);
  out.delete('content-encoding');
  out.delete('content-length');
  return new Response(res.body, { status: res.status, headers: out });
}

function isFile(path: string) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function serveStatic(url: URL): Response {
  const path = normalize(join(DIST, decodeURIComponent(url.pathname)));
  if (path.startsWith(DIST) && isFile(path)) {
    // Hashed build assets never change
    const cache = url.pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache';
    return new Response(Bun.file(path), { headers: { 'Cache-Control': cache } });
  }
  // Single-page app: every other route is index.html
  return new Response(Bun.file(join(DIST, 'index.html')), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' },
  });
}

async function handle(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path.startsWith('/rest/v1')) return proxyRest(req, url);
  if (path === '/functions/v1/lcsc') return lcscHandler(req);

  if (path === '/api/health') {
    const api = await fetch(`${backup.postgrest}/stock_items?select=id&limit=1`).then(r => r.ok, () => false);
    return Response.json({ ok: api, api }, { status: api ? 200 : 503 });
  }
  if (path === '/api/backup/status') return Response.json({ ...backupStatus, supabase: supabaseConfigured(backup), intervalHours: BACKUP_HOURS });
  if (path === '/api/backup/run' && req.method === 'POST') return Response.json(await runBackup(backup));

  if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(url);
  return new Response('Not found', { status: 404 });
}

// ── Start ───────────────────────────────────────────────────

if (!DATABASE_URL || !AUTHENTICATOR_PASSWORD) {
  console.error('DATABASE_URL and AUTHENTICATOR_PASSWORD are required');
  process.exit(1);
}

await setupDatabase();

Bun.serve({ port: PORT, hostname: '0.0.0.0', fetch: handle, idleTimeout: 60 });
log(`StockQR listening on :${PORT}`);
log(supabaseConfigured(backup) ? `Backups: ${backup.dir} + ${backup.supabaseUrl}` : `Backups: ${backup.dir} (no Supabase mirror configured)`);

// Restore and backups run in the background so the app is reachable right away
(async () => {
  try {
    await waitForApi(backup);
    await restoreIfEmpty(backup);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    backup.mirrorBlocked = `restore from Supabase failed (${reason}). Fix it and restart the container.`;
    log('Restore failed:', reason);
  }
  await runBackup(backup);
  if (BACKUP_HOURS > 0) setInterval(() => runBackup(backup), BACKUP_HOURS * 3600_000);
})();
