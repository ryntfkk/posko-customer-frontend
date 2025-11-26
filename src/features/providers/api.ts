// src/features/providers/api.ts (create jika belum ada)
import api from '@/lib/axios';

export const fetchProviders = async (params?: any) => {
  try {
    const response = await api. get('/providers', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching providers:', error);
    throw error;
  }
};

export const fetchProviderById = async (providerId: string) => {
  try {
    const response = await api. get(`/providers/${providerId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching provider by ID:', error);
    throw error;
  }
};

export const getProviderProfile = async () => {
  try {
    const response = await api.get('/providers/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching provider profile:', error);
    throw error;
  }
};

export const createProvider = async (payload: any) => {
  try {
    const response = await api.post('/providers', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating provider:', error);
    throw error;
  }
};

export const updateProviderAvailability = async (payload: any) => {
  try {
    const response = await api.put('/providers/availability', payload);
    return response.data;
  } catch (error) {
    console.error('Error updating provider availability:', error);
    throw error;
  }
};