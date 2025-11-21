import api from '@/lib/axios';
import { ServiceResponse } from './types';

export const fetchServices = async () => {
  // Mengambil data dari http://localhost:4000/api/services
  const response = await api.get<ServiceResponse>('/services');
  return response.data;
};