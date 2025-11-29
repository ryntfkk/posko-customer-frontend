// src/features/providers/api.ts
import api from '@/lib/axios';
import { ProviderListResponse, Provider } from './types';

// Interface untuk parameter query
export interface FetchProvidersParams {
  lat?: number;
  lng?: number;
  category?: string;
  search?: string;
  sortBy?: 'distance' | 'price_asc' | 'price_desc' | 'rating';
  limit?: number; // [BARU] Tambahkan ini
}

export const fetchProviders = async (params: FetchProvidersParams) => {
  // Axios otomatis mengubah object params menjadi query string:
  const response = await api.get<ProviderListResponse>('/providers', { params });
  return response.data;
};

export const fetchProviderById = async (id: string) => {
  const response = await api.get<{ data: Provider }>(`/providers/${id}`);
  return response.data;
};

// Get My Provider Profile (Untuk Dashboard)
export const fetchMyProviderProfile = async () => {
  const response = await api.get<{ data: Provider }>('/providers/me');
  return response.data;
};

// [UPDATE] Update Ketersediaan (Blocked Dates)
// Menggantikan updateProviderSchedule
export const updateAvailability = async (blockedDates: string[]) => {
  const response = await api.put<{ message: string; data: string[] }>('/providers/availability', { blockedDates });
  return response.data;
};