import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAll, upsert, remove } from '@/services/api';
import type { StockItem } from '@/types';

const TABLE = 'stock_items';
const KEY = ['stock_items'];

export function useStockItems() {
  return useQuery<StockItem[]>({
    queryKey: KEY,
    queryFn: () => getAll<StockItem>(TABLE),
  });
}

export function useStockItem(id: string | undefined) {
  const { data: items } = useStockItems();
  return items?.find(i => i.id === id) ?? null;
}

export function useUpsertStockItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (item: StockItem) => upsert(TABLE, item),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteStockItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remove(TABLE, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
