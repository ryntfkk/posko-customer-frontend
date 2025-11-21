// src/features/providers/api.ts
import api from '@/lib/axios';
import { ProviderListResponse } from './types';

export const fetchProviders = async () => {
  const response = await api.get<ProviderListResponse>('/providers');
  return response.data;
};