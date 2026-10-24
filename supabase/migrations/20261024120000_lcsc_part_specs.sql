-- N° LCSC et caractéristiques techniques récupérées automatiquement
ALTER TABLE public.stock_items ADD COLUMN IF NOT EXISTS lcsc_part TEXT DEFAULT '';
ALTER TABLE public.stock_items ADD COLUMN IF NOT EXISTS specs JSONB NOT NULL DEFAULT '[]'::jsonb;

NOTIFY pgrst, 'reload schema';
