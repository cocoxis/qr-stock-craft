import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  name: string;
  sku: string | null;
  quantity: number;
  unit: string | null;
  supplier: string | null;
  supplier_link: string | null;
  checked: boolean;
  created_at: string;
}

export interface ShoppingList {
  id: string;
  user_id: string;
  name: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  items?: ShoppingListItem[];
}

const KEY = ['shopping_lists'];

export function useShoppingLists(status?: 'active' | 'archived') {
  return useQuery<ShoppingList[]>({
    queryKey: [...KEY, status],
    queryFn: async () => {
      let q = supabase.from('shopping_lists').select('*').order('created_at', { ascending: false });
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ShoppingList[];
    },
  });
}

export function useShoppingListWithItems(id: string | undefined) {
  return useQuery<ShoppingList | null>({
    queryKey: [...KEY, id],
    enabled: !!id,
    queryFn: async () => {
      const { data: list, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      const { data: items, error: itemsError } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('shopping_list_id', id!)
        .order('created_at', { ascending: true });
      if (itemsError) throw itemsError;
      return { ...list, items: items ?? [] } as unknown as ShoppingList;
    },
  });
}

export function useCreateShoppingList() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('shopping_lists')
        .insert({ name, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useArchiveShoppingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shopping_lists')
        .update({ status: 'archived', archived_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteShoppingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shopping_lists').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAddShoppingListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<ShoppingListItem, 'id' | 'created_at' | 'checked'>) => {
      const { error } = await supabase.from('shopping_list_items').insert(item as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useToggleShoppingListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, checked }: { id: string; checked: boolean }) => {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ checked } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRemoveShoppingListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shopping_list_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
