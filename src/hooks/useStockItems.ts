import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { StockItem } from '@/types';

const KEY = ['stock_items'];

function rowToItem(row: any): StockItem {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    description: row.description,
    supplier: row.supplier,
    supplierRef: row.supplier_ref,
    supplierLink: row.supplier_link,
    imageUrl: row.image_url,
    quantity: row.quantity,
    minQuantity: row.min_quantity,
    unit: row.unit,
    location: row.location,
    price: Number(row.price),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    componentValue: row.component_value,
    componentVoltage: row.component_voltage,
    componentFootprint: row.component_footprint,
    screwType: row.screw_type,
    screwLength: row.screw_length,
    screwShape: row.screw_shape,
    link: row.link,
    lcscPart: row.lcsc_part ?? '',
    specs: Array.isArray(row.specs) ? row.specs : [],
  };
}

function itemToRow(item: StockItem): Record<string, unknown> {
  return {
    id: item.id,
    name: item.name,
    sku: item.sku,
    category: item.category,
    description: item.description,
    supplier: item.supplier,
    supplier_ref: item.supplierRef,
    supplier_link: item.supplierLink,
    image_url: item.imageUrl,
    quantity: item.quantity,
    min_quantity: item.minQuantity,
    unit: item.unit,
    location: item.location,
    price: item.price,
    component_value: item.componentValue,
    component_voltage: item.componentVoltage,
    component_footprint: item.componentFootprint,
    screw_type: item.screwType,
    screw_length: item.screwLength,
    screw_shape: item.screwShape,
    link: item.link,
    lcsc_part: item.lcscPart ?? '',
    specs: item.specs ?? [],
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

export function useStockItems() {
  return useQuery<StockItem[]>({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToItem);
    },
  });
}

export function useStockItem(id: string | undefined) {
  const { data: items } = useStockItems();
  return items?.find(i => i.id === id) ?? null;
}

export function useUpsertStockItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: StockItem) => {
      const row = itemToRow(item);
      const { error } = await supabase
        .from('stock_items')
        .upsert(row as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteStockItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('stock_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useBulkUpsertStockItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: StockItem[]) => {
      if (items.length === 0) return;
      const { error } = await supabase
        .from('stock_items')
        .upsert(items.map(itemToRow) as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
