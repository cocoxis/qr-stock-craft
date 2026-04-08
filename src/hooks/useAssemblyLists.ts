import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AssemblyList, AssemblyItem } from '@/types';

const KEY = ['assembly_lists'];

export function useAssemblyLists() {
  return useQuery<AssemblyList[]>({
    queryKey: KEY,
    queryFn: async () => {
      const { data: lists, error } = await supabase
        .from('assembly_lists')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const { data: items, error: itemsError } = await supabase
        .from('assembly_items')
        .select('*');
      if (itemsError) throw itemsError;

      return (lists ?? []).map((l: any) => ({
        id: l.id,
        name: l.name,
        productName: l.product_name,
        description: l.description,
        createdAt: l.created_at,
        items: (items ?? [])
          .filter((i: any) => i.assembly_list_id === l.id)
          .map((i: any) => ({ stockItemId: i.stock_item_id, quantity: i.quantity })),
      }));
    },
  });
}

export function useAssemblyList(id: string | undefined) {
  const { data: lists } = useAssemblyLists();
  return lists?.find(l => l.id === id) ?? null;
}

export function useUpsertAssemblyList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (list: AssemblyList) => {
      const { items, ...rest } = list;
      const row = {
        id: rest.id,
        name: rest.name,
        product_name: rest.productName,
        description: rest.description,
        created_at: rest.createdAt,
      };
      const { error } = await supabase.from('assembly_lists').upsert(row as any);
      if (error) throw error;

      await supabase.from('assembly_items').delete().eq('assembly_list_id', list.id);
      if (items.length > 0) {
        const rows = items.map(i => ({
          assembly_list_id: list.id,
          stock_item_id: i.stockItemId,
          quantity: i.quantity,
        }));
        const { error: itemsError } = await supabase.from('assembly_items').insert(rows as any);
        if (itemsError) throw itemsError;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAssemblyList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assembly_lists').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
