import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAll, upsert, remove } from '@/services/api';
import type { Product } from '@/types';

const TABLE = 'products';
const KEY = ['products'];

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: KEY,
    queryFn: () => getAll<Product>(TABLE),
  });
}

export function useProduct(id: string | undefined) {
  const { data: items } = useProducts();
  return items?.find(i => i.id === id) ?? null;
}

export function useUpsertProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (item: Product) => upsert(TABLE, item),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remove(TABLE, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
