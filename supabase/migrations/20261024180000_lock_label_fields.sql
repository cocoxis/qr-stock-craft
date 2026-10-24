-- Labels are printed: the data they show (and the Data Matrix, which encodes the item id) must not change.
-- Locked once set: id, sku, lcsc_part, component_value and the MPN spec. Quantity, location, price… stay editable.
-- Deliberate correction (SQL editor only):
--   begin; set local app.unlock_labels = 'on'; update stock_items set … ; commit;

-- Unique numbers
create unique index if not exists stock_items_sku_key on public.stock_items (sku);
create unique index if not exists stock_items_lcsc_part_key on public.stock_items (lcsc_part) where lcsc_part <> '';

create or replace function public.protect_label_fields()
returns trigger
language plpgsql
as $$
declare
  old_mpn text := (select s->>'value' from jsonb_array_elements(coalesce(old.specs::jsonb, '[]'::jsonb)) s where s->>'name' = 'MPN' limit 1);
  new_mpn text := (select s->>'value' from jsonb_array_elements(coalesce(new.specs::jsonb, '[]'::jsonb)) s where s->>'name' = 'MPN' limit 1);
begin
  if coalesce(current_setting('app.unlock_labels', true), '') = 'on' then
    return new;
  end if;
  if new.id is distinct from old.id then
    raise exception 'Item id % is printed on labels and cannot change', old.id;
  end if;
  if new.sku is distinct from old.sku then
    raise exception 'SKU % is printed on labels and cannot change', old.sku;
  end if;
  if coalesce(old.lcsc_part, '') <> '' and new.lcsc_part is distinct from old.lcsc_part then
    raise exception 'LCSC number % is printed on labels and cannot change', old.lcsc_part;
  end if;
  if coalesce(old.component_value, '') <> '' and new.component_value is distinct from old.component_value then
    raise exception 'Value % is printed on labels and cannot change', old.component_value;
  end if;
  if coalesce(old_mpn, '') <> '' and new_mpn is distinct from old_mpn then
    raise exception 'MPN % is printed on labels and cannot change', old_mpn;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_label_fields on public.stock_items;
create trigger protect_label_fields
  before update on public.stock_items
  for each row execute function public.protect_label_fields();

-- Reference copy of what was printed on 2026-10-24 (not exposed to the app: RLS on, no policy)
create table if not exists public.label_snapshot as
  select id, sku, lcsc_part, component_value,
         (select s->>'value' from jsonb_array_elements(coalesce(specs::jsonb, '[]'::jsonb)) s where s->>'name' = 'MPN' limit 1) as mpn,
         now() as frozen_at
  from public.stock_items;
alter table public.label_snapshot enable row level security;
