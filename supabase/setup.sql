-- ============================================================
-- StockQR – Installation complète d'une nouvelle base Supabase
-- À coller dans Supabase > SQL Editor > New query, puis "Run".
-- ============================================================

-- ── updated_at automatique ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ── Stock ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stock_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  supplier TEXT DEFAULT '',
  supplier_ref TEXT DEFAULT '',
  supplier_link TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  location TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  component_value TEXT DEFAULT '',
  component_voltage TEXT DEFAULT '',
  component_footprint TEXT DEFAULT '',
  screw_type TEXT DEFAULT '',
  screw_length TEXT DEFAULT '',
  screw_shape TEXT DEFAULT '',
  link TEXT DEFAULT '',
  lcsc_part TEXT DEFAULT '',
  specs JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS update_stock_items_updated_at ON public.stock_items;
CREATE TRIGGER update_stock_items_updated_at
  BEFORE UPDATE ON public.stock_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Listes de courses ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  name TEXT NOT NULL DEFAULT 'Shopping list',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archived_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.shopping_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopping_list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'pcs',
  supplier TEXT,
  supplier_link TEXT,
  checked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS update_shopping_lists_updated_at ON public.shopping_lists;
CREATE TRIGGER update_shopping_lists_updated_at
  BEFORE UPDATE ON public.shopping_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Accès (l'app n'a pas de connexion : accès public) ───────
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can select stock_items" ON public.stock_items;
CREATE POLICY "Anyone can select stock_items" ON public.stock_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert stock_items" ON public.stock_items;
CREATE POLICY "Anyone can insert stock_items" ON public.stock_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update stock_items" ON public.stock_items;
CREATE POLICY "Anyone can update stock_items" ON public.stock_items FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Anyone can delete stock_items" ON public.stock_items;
CREATE POLICY "Anyone can delete stock_items" ON public.stock_items FOR DELETE USING (true);

DROP POLICY IF EXISTS "Anyone can select shopping_lists" ON public.shopping_lists;
CREATE POLICY "Anyone can select shopping_lists" ON public.shopping_lists FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert shopping_lists" ON public.shopping_lists;
CREATE POLICY "Anyone can insert shopping_lists" ON public.shopping_lists FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update shopping_lists" ON public.shopping_lists;
CREATE POLICY "Anyone can update shopping_lists" ON public.shopping_lists FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Anyone can delete shopping_lists" ON public.shopping_lists;
CREATE POLICY "Anyone can delete shopping_lists" ON public.shopping_lists FOR DELETE USING (true);

DROP POLICY IF EXISTS "Anyone can select shopping_list_items" ON public.shopping_list_items;
CREATE POLICY "Anyone can select shopping_list_items" ON public.shopping_list_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert shopping_list_items" ON public.shopping_list_items;
CREATE POLICY "Anyone can insert shopping_list_items" ON public.shopping_list_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update shopping_list_items" ON public.shopping_list_items;
CREATE POLICY "Anyone can update shopping_list_items" ON public.shopping_list_items FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Anyone can delete shopping_list_items" ON public.shopping_list_items;
CREATE POLICY "Anyone can delete shopping_list_items" ON public.shopping_list_items FOR DELETE USING (true);

-- ── Droits pour l'API (nécessaire sur les nouveaux projets Supabase) ──
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_items, public.shopping_lists, public.shopping_list_items TO anon, authenticated;

-- Recharge le cache de l'API pour qu'elle voie les nouvelles tables
NOTIFY pgrst, 'reload schema';
