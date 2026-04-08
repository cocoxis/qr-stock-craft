
-- Shopping lists table
CREATE TABLE public.shopping_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Liste de courses',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archived_at TIMESTAMP WITH TIME ZONE
);

-- Shopping list items table
CREATE TABLE public.shopping_list_items (
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

-- Enable RLS
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for shopping_lists
CREATE POLICY "Users can view own shopping lists" ON public.shopping_lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own shopping lists" ON public.shopping_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shopping lists" ON public.shopping_lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shopping lists" ON public.shopping_lists
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for shopping_list_items
CREATE POLICY "Users can view own shopping list items" ON public.shopping_list_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.shopping_lists WHERE id = shopping_list_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create items in own lists" ON public.shopping_list_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.shopping_lists WHERE id = shopping_list_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update items in own lists" ON public.shopping_list_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.shopping_lists WHERE id = shopping_list_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete items in own lists" ON public.shopping_list_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.shopping_lists WHERE id = shopping_list_id AND user_id = auth.uid())
  );

-- Updated_at trigger for shopping_lists
CREATE TRIGGER update_shopping_lists_updated_at
  BEFORE UPDATE ON public.shopping_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
