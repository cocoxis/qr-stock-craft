
-- Stock items table
CREATE TABLE public.stock_items (
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Products table
CREATE TABLE public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  assembly_list_id TEXT DEFAULT '',
  quantity_produced INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Assembly lists table
CREATE TABLE public.assembly_lists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  product_name TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Assembly items table
CREATE TABLE public.assembly_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assembly_list_id TEXT NOT NULL REFERENCES public.assembly_lists(id) ON DELETE CASCADE,
  stock_item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assembly_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assembly_items ENABLE ROW LEVEL SECURITY;

-- RLS: all authenticated users can CRUD
CREATE POLICY "Authenticated users can select stock_items" ON public.stock_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert stock_items" ON public.stock_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update stock_items" ON public.stock_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete stock_items" ON public.stock_items FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can select products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update products" ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete products" ON public.products FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can select assembly_lists" ON public.assembly_lists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert assembly_lists" ON public.assembly_lists FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update assembly_lists" ON public.assembly_lists FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete assembly_lists" ON public.assembly_lists FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can select assembly_items" ON public.assembly_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert assembly_items" ON public.assembly_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update assembly_items" ON public.assembly_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete assembly_items" ON public.assembly_items FOR DELETE TO authenticated USING (true);

-- Updated_at trigger for stock_items
CREATE TRIGGER update_stock_items_updated_at
  BEFORE UPDATE ON public.stock_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
