/**
 * API client for PostgREST.
 *
 * In local development the API is not available:
 * hooks detect this and fall back to localStorage.
 *
 * In production on the NAS, VITE_API_URL = "/api" (default).
 */

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ── Helpers camelCase ↔ snake_case ──────────────────────────

function toSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function toCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function keysToSnake(obj: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[toSnake(k)] = v;
  }
  return out;
}

function keysToCamel<T>(obj: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[toCamel(k)] = v;
  }
  return out as T;
}

// ── Generic CRUD ────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
}

export async function getAll<T>(table: string): Promise<T[]> {
  const rows = await request<Record<string, unknown>[]>(`/${table}?order=created_at.desc`);
  return rows.map((r) => keysToCamel<T>(r));
}

export async function getById<T>(table: string, id: string): Promise<T | null> {
  const rows = await request<Record<string, unknown>[]>(`/${table}?id=eq.${id}`);
  return rows.length ? keysToCamel<T>(rows[0]) : null;
}

export async function upsert<T extends object>(table: string, data: T): Promise<void> {
  await request(`/${table}`, {
    method: 'POST',
    headers: {
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(keysToSnake(data)),
  });
}

export async function remove(table: string, id: string): Promise<void> {
  await request(`/${table}?id=eq.${id}`, { method: 'DELETE' });
}

// ── Health check (detects whether the API is available) ─────────

export async function isApiAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/stock_items?limit=0`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
