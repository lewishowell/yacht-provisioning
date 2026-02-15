import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { RecipeSearchResult, RecipeDetail } from '../types';

export function useRecipeSearch(query: string) {
  return useQuery({
    queryKey: ['recipes', 'search', query],
    queryFn: async () => {
      const { data } = await api.get<RecipeSearchResult[]>('/recipes/search', {
        params: { q: query },
      });
      return data;
    },
    enabled: query.trim().length >= 2,
    staleTime: 5 * 60 * 1000, // cache results 5 min
  });
}

export function useRecipeDetail(id: number | null) {
  return useQuery({
    queryKey: ['recipes', id],
    queryFn: async () => {
      const { data } = await api.get<RecipeDetail>(`/recipes/${id}`);
      return data;
    },
    enabled: id !== null,
    staleTime: 10 * 60 * 1000,
  });
}

export function useRecipeEnabled() {
  return useQuery({
    queryKey: ['recipes', 'enabled'],
    queryFn: async () => {
      const { data } = await api.get<{ enabled: boolean }>('/recipes/enabled');
      return data.enabled;
    },
    staleTime: 60 * 60 * 1000, // cache 1 hour
  });
}
