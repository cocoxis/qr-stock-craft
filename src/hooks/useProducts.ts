import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/types';

const KEY = ['products'];

function rowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    description: row.description,
    imageUrl: row.image_url,
    assemblyListId: row.assembly_list_id,
    quantityProduced: row.quantity_produced,
    minQuantity: row.min_quantity,
    createdAt: row.created_at,
  };
}

function productToRow(p: Product): Record<string, unknown> {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    description: p.description,
    image_url: p.imageUrl,
    assembly_list_id: p.assemblyListId,
    quantity_produced: p.quantityProduced,
    min_quantity: p.minQuantity,
    created_at: p.createdAt,
  };
}

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToProduct);
    },
  });
}

export function useProduct(id: string | undefined) {
  const { data: items } = useProducts();
  return items?.find(i => i.id === id) ?? null;
}

export function useUpsertProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Product) => {
      const row = productToRow(product);
      const { error } = await supabase.from('products').upsert(row as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
