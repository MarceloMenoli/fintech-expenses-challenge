import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import type { Category, Envelope } from './types';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api', timeout: 15000 });

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (data && typeof data === 'object' && 'message' in data) {
      const message = data.message;
      if (typeof message === 'string') return message;
      if (Array.isArray(message) && message.every((item) => typeof item === 'string')) return message.join(' ');
    }
    if (!error.response) return 'Não foi possível conectar. Verifique sua conexão e tente novamente.';
  }
  return error instanceof Error ? error.message : 'Não foi possível concluir a ação.';
}

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: async () => (await api.get<Envelope<Category[]>>('/categories')).data.data });
}
