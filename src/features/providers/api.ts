// src/features/providers/api.ts
import api from '@/lib/axios';
import { ProviderListResponse, Provider } from './types';

// [BARU] Interface untuk parameter query
export interface FetchProvidersParams {
  lat?: number;
  lng?: number;
  category?: string;
  search?: string;
  sortBy?: 'distance' | 'price_asc' | 'price_desc' | 'rating';
}

// [PERBAIKAN] Menerima object params, bukan argumen terpisah
export const fetchProviders = async (params: FetchProvidersParams) => {
  // Axios otomatis mengubah object params menjadi query string:
  // /providers?lat=...&lng=...&category=ac&sortBy=distance
  const response = await api.get<ProviderListResponse>('/providers', { params });
  return response.data;
};

export const fetchProviderById = async (id: string) => {
  const response = await api.get<{ data: Provider }>(`/providers/${id}`);
  return response.data;
};