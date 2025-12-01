import api from '@/lib/axios';
import { ProviderListResponse, Provider } from './types';

// Interface untuk parameter query
export interface FetchProvidersParams {
  lat?: number;
  lng?: number;
  category?: string;
  search?: string;
  sortBy?: 'distance' | 'price_asc' | 'price_desc' | 'rating';
  limit?: number;
  page?: number;
}

export const fetchProviders = async (params: FetchProvidersParams) => {
  const response = await api.get<ProviderListResponse>('/providers', { params });
  return response.data;
};

export const fetchProviderById = async (id: string) => {
  const response = await api.get<{ data: Provider }>(`/providers/${id}`);
  return response.data;
};