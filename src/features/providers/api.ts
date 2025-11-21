// src/features/providers/api.ts
import api from '@/lib/axios';
import { ProviderListResponse, Provider } from './types';

// Update fetchProviders agar menerima parameter opsional
export const fetchProviders = async (lat?: number, lng?: number) => {
  const params = lat && lng ? { lat, lng } : {};
  const response = await api.get<ProviderListResponse>('/providers', { params });
  return response.data;
};

export const fetchProviderById = async (id: string) => {
  const response = await api.get<{ data: Provider }>(`/providers/${id}`);
  return response.data;
};