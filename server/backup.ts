/**
 * Backups of the local database:
 *  - a JSON snapshot in BACKUP_DIR (the last BACKUP_KEEP are kept)
 *  - a mirror of every table to a Supabase project (optional)
 * and the first-start restore from that Supabase project when the local database is empty.
 */
import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Insert order (parents first). Deletions go the other way. */
const TABLES = ['shopping_lists', 'stock_items', 'shopping_list_items'] as const;
type Table = (typeof TABLES)[number];
type Row = Record<string, unknown> & { id: string };

export interface BackupConfig {
  postgrest: string;
  dir: string;
  keep: number;
  supabaseUrl: string;
  supabaseKey: string;
  /** Set when the local data cannot be trusted (failed restore): no mirror, so Supabase keeps the good copy */
  mirrorBlocked?: string;
}

export interface BackupStatus {
  at: string | null;
  ok: boolean;
  message: string;
  counts: Partial<Record<Table, number>>;
  file: string | null;
  mirrored: boolean;
}

export const status: BackupStatus = { at: null, ok: false, message: 'No backup yet', counts: {}, file: null, mirrored: false };

const log = (...args: unknown[]) => console.log(`[${new Date().toISOString()}] [backup]`, ...args);

async function check(res: Response, what: string) {
  if (!res.ok) throw new Error(`${what}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  return res;
}

// ── Local database (through PostgREST) ──────────────────────

async function readLocal(cfg: BackupConfig, table: Table): Promise<Row[]> {
  const res = await check(await fetch(`${cfg.postgrest}/${table}?select=*&order=id`), `read local ${table}`);
  return res.json();
}

async function insertLocal(cfg: BackupConfig, table: Table, rows: Row[]) {
  for (let i = 0; i < rows.length; i += 200) {
    await check(
      await fetch(`${cfg.postgrest}/${table}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(rows.slice(i, i + 200)),
      }),
      `restore ${table}`,
    );
  }
}

/** Waits until PostgREST answers (it starts after the database and loads the schema). */
export async function waitForApi(cfg: BackupConfig, timeoutMs = 120_000) {
  const end = Date.now() + timeoutMs;
  for (;;) {
    try {
      const res = await fetch(`${cfg.postgrest}/stock_items?select=id&limit=1`);
      if (res.ok) return;
    } catch { /* not up yet */ }
    if (Date.now() > end) throw new Error('PostgREST did not become ready');
    await Bun.sleep(2000);
  }
}

// ── Supabase project ────────────────────────────────────────

const remoteHeaders = (cfg: BackupConfig) => ({
  apikey: cfg.supabaseKey,
  Authorization: `Bearer ${cfg.supabaseKey}`,
  'Content-Type': 'application/json',
});

async function readRemote(cfg: BackupConfig, table: Table): Promise<Row[]> {
  const rows: Row[] = [];
  // Supabase returns at most 1000 rows per request
  for (let offset = 0; ; offset += 1000) {
    const res = await check(
      await fetch(`${cfg.supabaseUrl}/rest/v1/${table}?select=*&order=id&limit=1000&offset=${offset}`, { headers: remoteHeaders(cfg) }),
      `read Supabase ${table}`,
    );
    const page: Row[] = await res.json();
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

const inList = (ids: string[]) => `in.(${ids.map(id => `"${id.replace(/"/g, '\\"')}"`).join(',')})`;

async function upsertRemote(cfg: BackupConfig, table: Table, rows: Row[]) {
  for (let i = 0; i < rows.length; i += 200) {
    await check(
      await fetch(`${cfg.supabaseUrl}/rest/v1/${table}?on_conflict=id`, {
        method: 'POST',
        headers: { ...remoteHeaders(cfg), Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(rows.slice(i, i + 200)),
      }),
      `upsert Supabase ${table}`,
    );
  }
}

async function deleteRemote(cfg: BackupConfig, table: Table, ids: string[]) {
  for (let i = 0; i < ids.length; i += 100) {
    await check(
      await fetch(`${cfg.supabaseUrl}/rest/v1/${table}?id=${encodeURIComponent(inList(ids.slice(i, i + 100)))}`, {
        method: 'DELETE',
        headers: { ...remoteHeaders(cfg), Prefer: 'return=minimal' },
      }),
      `delete from Supabase ${table}`,
    );
  }
}

// ── Public API ──────────────────────────────────────────────

export const supabaseConfigured = (cfg: BackupConfig) => !!(cfg.supabaseUrl && cfg.supabaseKey);

/** First start: fills an empty local database from the Supabase project. */
export async function restoreIfEmpty(cfg: BackupConfig) {
  if (!supabaseConfigured(cfg)) return;
  if ((await readLocal(cfg, 'stock_items')).length > 0) return;
  log('Local database is empty: restoring from Supabase…');
  for (const table of TABLES) {
    const rows = await readRemote(cfg, table);
    await insertLocal(cfg, table, rows);
    log(`  ${table}: ${rows.length} rows restored`);
  }
}

let running = false;

export async function runBackup(cfg: BackupConfig): Promise<BackupStatus> {
  if (running) return status;
  running = true;
  const at = new Date().toISOString();
  try {
    const data = {} as Record<Table, Row[]>;
    for (const table of TABLES) data[table] = await readLocal(cfg, table);
    const counts = Object.fromEntries(TABLES.map(t => [t, data[t].length])) as BackupStatus['counts'];

    // 1. Snapshot file
    await mkdir(cfg.dir, { recursive: true });
    const file = `stockqr-${at.replace(/[:.]/g, '-')}.json`;
    await writeFile(join(cfg.dir, file), JSON.stringify({ createdAt: at, tables: data }));
    const old = (await readdir(cfg.dir)).filter(f => /^stockqr-.*\.json$/.test(f)).sort().reverse().slice(cfg.keep);
    await Promise.all(old.map(f => unlink(join(cfg.dir, f))));

    // 2. Mirror to Supabase
    let mirrored = false;
    let note = '';
    if (supabaseConfigured(cfg) && cfg.mirrorBlocked) {
      note = ` Supabase mirror disabled: ${cfg.mirrorBlocked}`;
    } else if (supabaseConfigured(cfg)) {
      const remote = {} as Record<Table, Row[]>;
      for (const table of TABLES) remote[table] = await readRemote(cfg, table);
      // Safety: never let an emptied or half-wiped local database erase the backup
      const remoteItems = remote.stock_items.length;
      if (data.stock_items.length === 0 || (remoteItems > 10 && data.stock_items.length < remoteItems / 2)) {
        note = ` Supabase mirror skipped: local has ${data.stock_items.length} items, Supabase ${remoteItems}.`;
      } else {
        // Upserts parents first, deletions children first
        for (const table of TABLES) await upsertRemote(cfg, table, data[table]);
        let deleted = 0;
        for (const table of [...TABLES].reverse()) {
          const localIds = new Set(data[table].map(r => r.id));
          const gone = remote[table].map(r => r.id).filter(id => !localIds.has(id));
          await deleteRemote(cfg, table, gone);
          deleted += gone.length;
        }
        mirrored = true;
        if (deleted) note = ` ${deleted} deleted row(s) removed from Supabase.`;
      }
    }

    Object.assign(status, {
      at, ok: true, counts, file, mirrored,
      message: `Saved ${counts.stock_items} items to ${file}${mirrored ? ' and Supabase' : ''}.${note}`,
    });
  } catch (err) {
    Object.assign(status, { at, ok: false, message: err instanceof Error ? err.message : String(err) });
  } finally {
    running = false;
  }
  log(status.ok ? 'OK' : 'FAILED', status.message);
  return status;
}
