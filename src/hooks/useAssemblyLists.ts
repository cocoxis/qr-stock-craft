import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/services/api';
import type { AssemblyList, AssemblyItem } from '@/types';

const TABLE = 'assembly_lists';
const ITEMS_TABLE = 'assembly_items';
const KEY = ['assembly_lists'];

/** Fetch all assembly lists WITH their items joined client-side. */
export function useAssemblyLists() {
  return useQuery<AssemblyList[]>({
    queryKey: KEY,
    queryFn: async () => {
      const [lists, allItems] = await Promise.all([
        api.getAll<Omit<AssemblyList, 'items'> & { items?: AssemblyItem[] }>(TABLE),
        api.getAll<AssemblyItem & { assemblyListId: string }>(ITEMS_TABLE),
      ]);
      return lists.map(l => ({
        ...l,
        items: allItems.filter(i => i.assemblyListId === l.id).map(i => ({
          stockItemId: i.stockItemId,
          quantity: i.quantity,
        })),
      }));
    },
  });
}

export function useAssemblyList(id: string | undefined) {
  const { data } = useAssemblyLists();
  return data?.find(l => l.id === id) ?? null;
}

export function useUpsertAssemblyList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (list: AssemblyList) => {
      const { items, ...meta } = list;
      // Upsert the list metadata
      await api.upsert(TABLE, meta);
      // Delete old items then re-insert
      // PostgREST: DELETE where assembly_list_id=eq.X
      await fetch(`${import.meta.env.VITE_API_URL || '/api'}/${ITEMS_TABLE}?assembly_list_id=eq.${list.id}`, {
        method: 'DELETE',
      });
      // Insert new items
      if (items.length > 0) {
        await fetch(`${import.meta.env.VITE_API_URL || '/api'}/${ITEMS_TABLE}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(items.map(i => ({
            assembly_list_id: list.id,
            stock_item_id: i.stockItemId,
            quantity: i.quantity,
          }))),
        });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAssemblyList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(TABLE, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
