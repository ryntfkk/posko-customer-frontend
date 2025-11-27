// src/features/providers/api.ts
import api from '@/lib/axios';
import { Provider } from './types';

interface ProviderQueryParams {
  category?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

interface ProviderResponse {
  messageKey?: string;
  message?: string;
  data: Provider | Provider[];
}

interface AvailabilityPayload {
  isOnline?: boolean;
  blockedDates?: string[];
}

export const fetchProviders = async (params?: ProviderQueryParams) => {
  try {
    const response = await api.get<ProviderResponse>('/providers', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching providers:', error);
    throw error;
  }
};

export const fetchProviderById = async (providerId: string) => {
  try {
    const response = await api.get<ProviderResponse>(`/providers/${providerId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching provider by ID:', error);
    throw error;
  }
};

export const getProviderProfile = async () => {
  try {
    const response = await api.get<ProviderResponse>('/providers/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching provider profile:', error);
    throw error;
  }
};

export const fetchMyProviderProfile = async () => {
  try {
    const response = await api.get<ProviderResponse>('/providers/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching my provider profile:', error);
    throw error;
  }
};

export const createProvider = async (payload: { services: Array<{ serviceId: string; price: number }> }) => {
  try {
    const response = await api.post<ProviderResponse>('/providers', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating provider:', error);
    throw error;
  }
};

export const updateProviderAvailability = async (payload: AvailabilityPayload) => {
  try {
    const response = await api.put<ProviderResponse>('/providers/availability', payload);
    return response.data;
  } catch (error) {
    console.error('Error updating provider availability:', error);
    throw error;
  }
};

export const updateAvailability = async (payload: AvailabilityPayload) => {
  try {
    const response = await api.put<ProviderResponse>('/providers/availability', payload);
    return response.data;
  } catch (error) {
    console.error('Error updating availability:', error);
    throw error;
  }
};