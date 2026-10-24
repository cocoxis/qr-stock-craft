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

-- ── Données d'exemple : résistances E12 0805, 10Ω → 1MΩ, 100 pcs ──
INSERT INTO public.stock_items (id, name, sku, category, description, quantity, min_quantity, unit, price, component_value, component_voltage, component_footprint) VALUES
  ('stk-r0805-10R', 'Resistor 10Ω 0805', 'COMP-R0805-10R', 'Resistors', 'SMD resistor 0805 10Ω 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '10Ω', '', '0805'),
  ('stk-r0805-12R', 'Resistor 12Ω 0805', 'COMP-R0805-12R', 'Resistors', 'SMD resistor 0805 12Ω 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '12Ω', '', '0805'),
  ('stk-r0805-15R', 'Resistor 15Ω 0805', 'COMP-R0805-15R', 'Resistors', 'SMD resistor 0805 15Ω 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '15Ω', '', '0805'),
  ('stk-r0805-18R', 'Resistor 18Ω 0805', 'COMP-R0805-18R', 'Resistors', 'SMD resistor 0805 18Ω 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '18Ω', '', '0805'),
  ('stk-r0805-22R', 'Resistor 22Ω 0805', 'COMP-R0805-22R', 'Resistors', 'SMD resistor 0805 22Ω 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '22Ω', '', '0805'),
  ('stk-r0805-27R', 'Resistor 27Ω 0805', 'COMP-R0805-27R', 'Resistors', 'SMD resistor 0805 27Ω 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '27Ω', '', '0805'),
  ('stk-r0805-33R', 'Resistor 33Ω 0805', 'COMP-R0805-33R', 'Resistors', 'SMD resistor 0805 33Ω 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '33Ω', '', '0805'),
  ('stk-r0805-39R', 'Resistor 39Ω 0805', 'COMP-R0805-39R', 'Resistors', 'SMD resistor 0805 39Ω 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '39Ω', '', '0805'),
  ('stk-r0805-47R', 'Resistor 47Ω 0805', 'COMP-R0805-47R', 'Resistors', 'SMD resistor 0805 47Ω 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '47Ω', '', '0805'),
  ('stk-r0805-56R', 'Resistor 56Ω 0805', 'COMP-R0805-56R', 'Resistors', 'SMD resistor 0805 56Ω 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '56Ω', '', '0805'),
  ('stk-r0805-68R', 'Resistor 68Ω 0805', 'COMP-R0805-68R', 'Resistors', 'SMD resistor 0805 68Ω 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '68Ω', '', '0805'),
  ('stk-r0805-82R', 'Resistor 82Ω 0805', 'COMP-R0805-82R', 'Resistors', 'SMD resistor 0805 82Ω 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '82Ω', '', '0805'),
  ('stk-r0805-100R', 'Resistor 100Ω 0805', 'COMP-R0805-100R', 'Resistors', 'SMD resistor 0805 100Ω 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '100Ω', '', '0805'),
  ('stk-r0805-120R', 'Resistor 120Ω 0805', 'COMP-R0805-120R', 'Resistors', 'SMD resistor 0805 120Ω 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '120Ω', '', '0805'),
  ('stk-r0805-150R', 'Resistor 150Ω 0805', 'COMP-R0805-150R', 'Resistors', 'SMD resistor 0805 150Ω 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '150Ω', '', '0805'),
  ('stk-r0805-180R', 'Resistor 180Ω 0805', 'COMP-R0805-180R', 'Resistors', 'SMD resistor 0805 180Ω 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '180Ω', '', '0805'),
  ('stk-r0805-220R', 'Resistor 220Ω 0805', 'COMP-R0805-220R', 'Resistors', 'SMD resistor 0805 220Ω 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '220Ω', '', '0805'),
  ('stk-r0805-270R', 'Resistor 270Ω 0805', 'COMP-R0805-270R', 'Resistors', 'SMD resistor 0805 270Ω 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '270Ω', '', '0805'),
  ('stk-r0805-330R', 'Resistor 330Ω 0805', 'COMP-R0805-330R', 'Resistors', 'SMD resistor 0805 330Ω 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '330Ω', '', '0805'),
  ('stk-r0805-390R', 'Resistor 390Ω 0805', 'COMP-R0805-390R', 'Resistors', 'SMD resistor 0805 390Ω 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '390Ω', '', '0805'),
  ('stk-r0805-470R', 'Resistor 470Ω 0805', 'COMP-R0805-470R', 'Resistors', 'SMD resistor 0805 470Ω 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '470Ω', '', '0805'),
  ('stk-r0805-560R', 'Resistor 560Ω 0805', 'COMP-R0805-560R', 'Resistors', 'SMD resistor 0805 560Ω 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '560Ω', '', '0805'),
  ('stk-r0805-680R', 'Resistor 680Ω 0805', 'COMP-R0805-680R', 'Resistors', 'SMD resistor 0805 680Ω 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '680Ω', '', '0805'),
  ('stk-r0805-820R', 'Resistor 820Ω 0805', 'COMP-R0805-820R', 'Resistors', 'SMD resistor 0805 820Ω 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '820Ω', '', '0805'),
  ('stk-r0805-1K', 'Resistor 1kΩ 0805', 'COMP-R0805-1K', 'Resistors', 'SMD resistor 0805 1kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '1kΩ', '', '0805'),
  ('stk-r0805-1K2', 'Resistor 1.2kΩ 0805', 'COMP-R0805-1K2', 'Resistors', 'SMD resistor 0805 1.2kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '1.2kΩ', '', '0805'),
  ('stk-r0805-1K5', 'Resistor 1.5kΩ 0805', 'COMP-R0805-1K5', 'Resistors', 'SMD resistor 0805 1.5kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '1.5kΩ', '', '0805'),
  ('stk-r0805-1K8', 'Resistor 1.8kΩ 0805', 'COMP-R0805-1K8', 'Resistors', 'SMD resistor 0805 1.8kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '1.8kΩ', '', '0805'),
  ('stk-r0805-2K2', 'Resistor 2.2kΩ 0805', 'COMP-R0805-2K2', 'Resistors', 'SMD resistor 0805 2.2kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '2.2kΩ', '', '0805'),
  ('stk-r0805-2K7', 'Resistor 2.7kΩ 0805', 'COMP-R0805-2K7', 'Resistors', 'SMD resistor 0805 2.7kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '2.7kΩ', '', '0805'),
  ('stk-r0805-3K3', 'Resistor 3.3kΩ 0805', 'COMP-R0805-3K3', 'Resistors', 'SMD resistor 0805 3.3kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '3.3kΩ', '', '0805'),
  ('stk-r0805-3K9', 'Resistor 3.9kΩ 0805', 'COMP-R0805-3K9', 'Resistors', 'SMD resistor 0805 3.9kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '3.9kΩ', '', '0805'),
  ('stk-r0805-4K7', 'Resistor 4.7kΩ 0805', 'COMP-R0805-4K7', 'Resistors', 'SMD resistor 0805 4.7kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '4.7kΩ', '', '0805'),
  ('stk-r0805-5K6', 'Resistor 5.6kΩ 0805', 'COMP-R0805-5K6', 'Resistors', 'SMD resistor 0805 5.6kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '5.6kΩ', '', '0805'),
  ('stk-r0805-6K8', 'Resistor 6.8kΩ 0805', 'COMP-R0805-6K8', 'Resistors', 'SMD resistor 0805 6.8kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '6.8kΩ', '', '0805'),
  ('stk-r0805-8K2', 'Resistor 8.2kΩ 0805', 'COMP-R0805-8K2', 'Resistors', 'SMD resistor 0805 8.2kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '8.2kΩ', '', '0805'),
  ('stk-r0805-10K', 'Resistor 10kΩ 0805', 'COMP-R0805-10K', 'Resistors', 'SMD resistor 0805 10kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '10kΩ', '', '0805'),
  ('stk-r0805-12K', 'Resistor 12kΩ 0805', 'COMP-R0805-12K', 'Resistors', 'SMD resistor 0805 12kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '12kΩ', '', '0805'),
  ('stk-r0805-15K', 'Resistor 15kΩ 0805', 'COMP-R0805-15K', 'Resistors', 'SMD resistor 0805 15kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '15kΩ', '', '0805'),
  ('stk-r0805-18K', 'Resistor 18kΩ 0805', 'COMP-R0805-18K', 'Resistors', 'SMD resistor 0805 18kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '18kΩ', '', '0805'),
  ('stk-r0805-22K', 'Resistor 22kΩ 0805', 'COMP-R0805-22K', 'Resistors', 'SMD resistor 0805 22kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '22kΩ', '', '0805'),
  ('stk-r0805-27K', 'Resistor 27kΩ 0805', 'COMP-R0805-27K', 'Resistors', 'SMD resistor 0805 27kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '27kΩ', '', '0805'),
  ('stk-r0805-33K', 'Resistor 33kΩ 0805', 'COMP-R0805-33K', 'Resistors', 'SMD resistor 0805 33kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '33kΩ', '', '0805'),
  ('stk-r0805-39K', 'Resistor 39kΩ 0805', 'COMP-R0805-39K', 'Resistors', 'SMD resistor 0805 39kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '39kΩ', '', '0805'),
  ('stk-r0805-47K', 'Resistor 47kΩ 0805', 'COMP-R0805-47K', 'Resistors', 'SMD resistor 0805 47kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '47kΩ', '', '0805'),
  ('stk-r0805-56K', 'Resistor 56kΩ 0805', 'COMP-R0805-56K', 'Resistors', 'SMD resistor 0805 56kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '56kΩ', '', '0805'),
  ('stk-r0805-68K', 'Resistor 68kΩ 0805', 'COMP-R0805-68K', 'Resistors', 'SMD resistor 0805 68kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '68kΩ', '', '0805'),
  ('stk-r0805-82K', 'Resistor 82kΩ 0805', 'COMP-R0805-82K', 'Resistors', 'SMD resistor 0805 82kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '82kΩ', '', '0805'),
  ('stk-r0805-100K', 'Resistor 100kΩ 0805', 'COMP-R0805-100K', 'Resistors', 'SMD resistor 0805 100kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '100kΩ', '', '0805'),
  ('stk-r0805-120K', 'Resistor 120kΩ 0805', 'COMP-R0805-120K', 'Resistors', 'SMD resistor 0805 120kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '120kΩ', '', '0805'),
  ('stk-r0805-150K', 'Resistor 150kΩ 0805', 'COMP-R0805-150K', 'Resistors', 'SMD resistor 0805 150kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '150kΩ', '', '0805'),
  ('stk-r0805-180K', 'Resistor 180kΩ 0805', 'COMP-R0805-180K', 'Resistors', 'SMD resistor 0805 180kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '180kΩ', '', '0805'),
  ('stk-r0805-220K', 'Resistor 220kΩ 0805', 'COMP-R0805-220K', 'Resistors', 'SMD resistor 0805 220kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '220kΩ', '', '0805'),
  ('stk-r0805-270K', 'Resistor 270kΩ 0805', 'COMP-R0805-270K', 'Resistors', 'SMD resistor 0805 270kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '270kΩ', '', '0805'),
  ('stk-r0805-330K', 'Resistor 330kΩ 0805', 'COMP-R0805-330K', 'Resistors', 'SMD resistor 0805 330kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '330kΩ', '', '0805'),
  ('stk-r0805-390K', 'Resistor 390kΩ 0805', 'COMP-R0805-390K', 'Resistors', 'SMD resistor 0805 390kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '390kΩ', '', '0805'),
  ('stk-r0805-470K', 'Resistor 470kΩ 0805', 'COMP-R0805-470K', 'Resistors', 'SMD resistor 0805 470kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '470kΩ', '', '0805'),
  ('stk-r0805-560K', 'Resistor 560kΩ 0805', 'COMP-R0805-560K', 'Resistors', 'SMD resistor 0805 560kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '560kΩ', '', '0805'),
  ('stk-r0805-680K', 'Resistor 680kΩ 0805', 'COMP-R0805-680K', 'Resistors', 'SMD resistor 0805 680kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '680kΩ', '', '0805'),
  ('stk-r0805-820K', 'Resistor 820kΩ 0805', 'COMP-R0805-820K', 'Resistors', 'SMD resistor 0805 820kΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '820kΩ', '', '0805'),
  ('stk-r0805-1M', 'Resistor 1MΩ 0805', 'COMP-R0805-1M', 'Resistors', 'SMD resistor 0805 1MΩ 1% 1/8W (E12 series)', 100, 20, 'pcs', 0.01, '1MΩ', '', '0805')
ON CONFLICT (id) DO NOTHING;

-- Recharge le cache de l'API pour qu'elle voie les nouvelles tables
NOTIFY pgrst, 'reload schema';
