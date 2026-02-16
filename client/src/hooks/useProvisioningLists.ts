import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { ProvisioningList, ProvisioningListItem, ListStatus } from '../types';

export function useProvisioningLists() {
  return useQuery({
    queryKey: ['provisioning-lists'],
    queryFn: async () => {
      const { data } = await api.get<ProvisioningList[]>('/provisioning-lists');
      return data;
    },
  });
}

export function useProvisioningList(id: string) {
  return useQuery({
    queryKey: ['provisioning-lists', id],
    queryFn: async () => {
      const { data } = await api.get<ProvisioningList>(
        `/provisioning-lists/${id}`,
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (list: { name: string; description?: string }) =>
      api.post('/provisioning-lists', list).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['provisioning-lists'] }),
  });
}

export function useUpdateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      description?: string;
      status?: ListStatus;
    }) => api.patch(`/provisioning-lists/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['provisioning-lists'] }),
  });
}

export function useDeleteList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/provisioning-lists/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['provisioning-lists'] }),
  });
}

export function useAddListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      listId,
      ...item
    }: Partial<ProvisioningListItem> & { listId: string }) =>
      api
        .post(`/provisioning-lists/${listId}/items`, item)
        .then((r) => r.data),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({
        queryKey: ['provisioning-lists', v.listId],
      }),
  });
}

export function useUpdateListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      listId,
      itemId,
      ...data
    }: {
      listId: string;
      itemId: string;
      name?: string;
      quantity?: number;
      unit?: string;
      category?: string;
    }) =>
      api
        .patch(`/provisioning-lists/${listId}/items/${itemId}`, data)
        .then((r) => r.data),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({
        queryKey: ['provisioning-lists', v.listId],
      }),
  });
}

export function useDeleteListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, itemId }: { listId: string; itemId: string }) =>
      api.delete(`/provisioning-lists/${listId}/items/${itemId}`),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({
        queryKey: ['provisioning-lists', v.listId],
      }),
  });
}

export function useAddRestockItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (listId: string) =>
      api
        .post(`/provisioning-lists/${listId}/add-restock-items`)
        .then((r) => r.data),
    onSuccess: (_d, listId) => {
      qc.invalidateQueries({ queryKey: ['provisioning-lists', listId] });
      qc.invalidateQueries({ queryKey: ['provisioning-lists'] });
    },
  });
}

export function useAddMealItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, mealId }: { listId: string; mealId: string }) =>
      api
        .post(`/provisioning-lists/${listId}/add-meal-items`, { mealId })
        .then((r) => r.data as { added: number; mealName: string }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['provisioning-lists', v.listId] });
      qc.invalidateQueries({ queryKey: ['provisioning-lists'] });
    },
  });
}

export function usePurchaseItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, itemId }: { listId: string; itemId: string }) =>
      api
        .post(`/provisioning-lists/${listId}/items/${itemId}/purchase`)
        .then((r) => r.data),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['provisioning-lists', v.listId] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/inventory/dashboard-stats');
      return data;
    },
  });
}
