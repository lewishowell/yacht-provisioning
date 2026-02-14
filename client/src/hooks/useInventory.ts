import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { InventoryItem, PaginatedResponse, Category } from '../types';

interface InventoryFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: Category | '';
  sort?: string;
  order?: 'asc' | 'desc';
}

export function useInventory(filters: InventoryFilters = {}) {
  return useQuery({
    queryKey: ['inventory', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.set('page', String(filters.page));
      if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
      if (filters.search) params.set('search', filters.search);
      if (filters.category) params.set('category', filters.category);
      if (filters.sort) params.set('sort', filters.sort);
      if (filters.order) params.set('order', filters.order);
      const { data } = await api.get<PaginatedResponse<InventoryItem>>(
        `/inventory?${params}`,
      );
      return data;
    },
  });
}

export function useLowStock() {
  return useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: async () => {
      const { data } = await api.get<InventoryItem[]>('/inventory/low-stock');
      return data;
    },
  });
}

export function useCreateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (item: Partial<InventoryItem>) =>
      api.post('/inventory', item).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
}

export function useUpdateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...item }: Partial<InventoryItem> & { id: string }) =>
      api.patch(`/inventory/${id}`, item).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
}

export function useDeleteInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/inventory/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
}

export function useGenerateShoppingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string | undefined = undefined) =>
      api.post('/inventory/generate-shopping-list', { name }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['provisioning-lists'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
