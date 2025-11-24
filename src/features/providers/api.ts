// src/features/providers/api.ts
import api from '@/lib/axios';
import { ProviderListResponse, Provider, ScheduleDay } from './types';

// Interface untuk parameter query
export interface FetchProvidersParams {
  lat?: number;
  lng?: number;
  category?: string;
  search?: string;
  sortBy?: 'distance' | 'price_asc' | 'price_desc' | 'rating';
}

export const fetchProviders = async (params: FetchProvidersParams) => {
  // Axios otomatis mengubah object params menjadi query string
  const response = await api.get<ProviderListResponse>('/providers', { params });
  return response.data;
};

export const fetchProviderById = async (id: string) => {
  const response = await api.get<{ data: Provider }>(`/providers/${id}`);
  return response.data;
};

// [BARU] Get My Provider Profile (Untuk Dashboard)
export const fetchMyProviderProfile = async () => {
  const response = await api.get<{ data: Provider }>('/providers/me');
  return response.data;
};

// Update Jadwal Provider
export const updateProviderSchedule = async (schedule: ScheduleDay[]) => {
  const response = await api.put<{ message: string; data: ScheduleDay[] }>('/providers/schedule', schedule);
  return response.data;
};