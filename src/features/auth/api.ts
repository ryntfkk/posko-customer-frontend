// src/features/auth/api.ts
import api from '@/lib/axios';
import { LoginResponse } from './types';

export const loginUser = async (credentials: { email: string; password: string }) => {
  // Backend route Anda ada di: /api/auth/login
  // Axios base URL sudah /api, jadi kita tinggal tambah /auth/login
  const response = await api.post<LoginResponse>('/auth/login', credentials);
  return response.data;
};