// src/features/services/api.ts
import api from '@/lib/axios';
import { Service, ServiceResponse } from './types';

export const fetchServices = async (category?: string | null) => {
  try {
    const params = category ? { category } : {};
    const response = await api. get<ServiceResponse>('/services', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
};

export const getServiceById = async (serviceId: string) => {
  try {
    const response = await api.get<ServiceResponse>(`/services/${serviceId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching service by ID:', error);
    throw error;
  }
};

export const createService = async (payload: any) => {
  try {
    const response = await api.post<ServiceResponse>('/services', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating service:', error);
    throw error;
  }
};

export const updateService = async (serviceId: string, payload: any) => {
  try {
    const response = await api.put<ServiceResponse>(`/services/${serviceId}`, payload);
    return response.data;
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

export const deleteService = async (serviceId: string) => {
  try {
    const response = await api.delete<ServiceResponse>(`/services/${serviceId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
};