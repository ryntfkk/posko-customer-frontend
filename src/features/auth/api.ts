// src/features/auth/api.ts
import api from '@/lib/axios';
import { AuthResponse, LoginPayload, RegisterPayload } from './types';

export const loginUser = async (credentials: LoginPayload) => {
  const response = await api.post<AuthResponse>('/auth/login', credentials);
  return response.data;
};

export const registerUser = async (payload: RegisterPayload) => {
  const response = await api.post<AuthResponse>('/auth/register', payload);
  return response.data;
};