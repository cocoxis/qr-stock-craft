-- ============================================================
-- StockQR – Schéma PostgreSQL pour auto-hébergement
-- ============================================================

-- 1. Rôle anonyme utilisé par PostgREST
CREATE ROLE web_anon NOLOGIN;

-- 2. Schéma exposé via l'API
CREATE SCHEMA IF NOT EXISTS api;

-- ── Stock items ─────────────────────────────────────────────
CREATE TABLE api.stock_items (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  sku           TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT '',
  description   TEXT NOT NULL DEFAULT '',
  supplier      TEXT NOT NULL DEFAULT '',
  supplier_ref  TEXT NOT NULL DEFAULT '',
  supplier_link TEXT NOT NULL DEFAULT '',
  image_url     TEXT NOT NULL DEFAULT '',
  quantity      INTEGER NOT NULL DEFAULT 0,
  min_quantity  INTEGER NOT NULL DEFAULT 0,
  unit          TEXT NOT NULL DEFAULT 'pcs',
  location      TEXT NOT NULL DEFAULT '',
  price         NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- Composants
  component_value     TEXT,
  component_voltage   TEXT,
  component_footprint TEXT,
  -- Visserie
  screw_type   TEXT,
  screw_length TEXT,
  screw_shape  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Products ────────────────────────────────────────────────
CREATE TABLE api.products (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  sku               TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  image_url         TEXT,
  assembly_list_id  TEXT NOT NULL DEFAULT '',
  quantity_produced INTEGER NOT NULL DEFAULT 0,
  min_quantity      INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Assembly lists ──────────────────────────────────────────
CREATE TABLE api.assembly_lists (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  product_name TEXT NOT NULL DEFAULT '',
  description  TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Assembly items (composants d'une liste) ─────────────────
CREATE TABLE api.assembly_items (
  id             SERIAL PRIMARY KEY,
  assembly_list_id TEXT NOT NULL REFERENCES api.assembly_lists(id) ON DELETE CASCADE,
  stock_item_id    TEXT NOT NULL,
  quantity         INTEGER NOT NULL DEFAULT 1
);

-- 3. Permissions pour le rôle anonyme (lecture + écriture)
GRANT USAGE ON SCHEMA api TO web_anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA api TO web_anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO web_anon;

-- 4. Trigger auto-update de updated_at
CREATE OR REPLACE FUNCTION api.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stock_items_updated
  BEFORE UPDATE ON api.stock_items
  FOR EACH ROW EXECUTE FUNCTION api.set_updated_at();
