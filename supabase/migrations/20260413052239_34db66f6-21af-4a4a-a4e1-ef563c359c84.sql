
-- Drop the trigger that creates profiles on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Update stock_items policies to allow anon
DROP POLICY IF EXISTS "Authenticated users can select stock_items" ON public.stock_items;
DROP POLICY IF EXISTS "Authenticated users can insert stock_items" ON public.stock_items;
DROP POLICY IF EXISTS "Authenticated users can update stock_items" ON public.stock_items;
DROP POLICY IF EXISTS "Authenticated users can delete stock_items" ON public.stock_items;
CREATE POLICY "Anyone can select stock_items" ON public.stock_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert stock_items" ON public.stock_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update stock_items" ON public.stock_items FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete stock_items" ON public.stock_items FOR DELETE USING (true);

-- Update products policies
DROP POLICY IF EXISTS "Authenticated users can select products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;
CREATE POLICY "Anyone can select products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Anyone can insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete products" ON public.products FOR DELETE USING (true);

-- Update assembly_lists policies
DROP POLICY IF EXISTS "Authenticated users can select assembly_lists" ON public.assembly_lists;
DROP POLICY IF EXISTS "Authenticated users can insert assembly_lists" ON public.assembly_lists;
DROP POLICY IF EXISTS "Authenticated users can update assembly_lists" ON public.assembly_lists;
DROP POLICY IF EXISTS "Authenticated users can delete assembly_lists" ON public.assembly_lists;
CREATE POLICY "Anyone can select assembly_lists" ON public.assembly_lists FOR SELECT USING (true);
CREATE POLICY "Anyone can insert assembly_lists" ON public.assembly_lists FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update assembly_lists" ON public.assembly_lists FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete assembly_lists" ON public.assembly_lists FOR DELETE USING (true);

-- Update assembly_items policies
DROP POLICY IF EXISTS "Authenticated users can select assembly_items" ON public.assembly_items;
DROP POLICY IF EXISTS "Authenticated users can insert assembly_items" ON public.assembly_items;
DROP POLICY IF EXISTS "Authenticated users can update assembly_items" ON public.assembly_items;
DROP POLICY IF EXISTS "Authenticated users can delete assembly_items" ON public.assembly_items;
CREATE POLICY "Anyone can select assembly_items" ON public.assembly_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert assembly_items" ON public.assembly_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update assembly_items" ON public.assembly_items FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete assembly_items" ON public.assembly_items FOR DELETE USING (true);

-- Update shopping_lists: make user_id have a default and update policies
ALTER TABLE public.shopping_lists ALTER COLUMN user_id SET DEFAULT '00000000-0000-0000-0000-000000000000'::uuid;
DROP POLICY IF EXISTS "Users can view own shopping lists" ON public.shopping_lists;
DROP POLICY IF EXISTS "Users can create own shopping lists" ON public.shopping_lists;
DROP POLICY IF EXISTS "Users can update own shopping lists" ON public.shopping_lists;
DROP POLICY IF EXISTS "Users can delete own shopping lists" ON public.shopping_lists;
CREATE POLICY "Anyone can select shopping_lists" ON public.shopping_lists FOR SELECT USING (true);
CREATE POLICY "Anyone can insert shopping_lists" ON public.shopping_lists FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update shopping_lists" ON public.shopping_lists FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete shopping_lists" ON public.shopping_lists FOR DELETE USING (true);

-- Update shopping_list_items policies
DROP POLICY IF EXISTS "Users can view own shopping list items" ON public.shopping_list_items;
DROP POLICY IF EXISTS "Users can create items in own lists" ON public.shopping_list_items;
DROP POLICY IF EXISTS "Users can update items in own lists" ON public.shopping_list_items;
DROP POLICY IF EXISTS "Users can delete items in own lists" ON public.shopping_list_items;
CREATE POLICY "Anyone can select shopping_list_items" ON public.shopping_list_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert shopping_list_items" ON public.shopping_list_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update shopping_list_items" ON public.shopping_list_items FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete shopping_list_items" ON public.shopping_list_items FOR DELETE USING (true);
