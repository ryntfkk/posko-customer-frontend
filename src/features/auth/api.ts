// src/features/auth/api.ts
import api from '@/lib/axios';
import { AuthResponse, LoginPayload, ProfileResponse, RegisterPayload } from './types';

export const loginUser = async (credentials: LoginPayload) => {
  const response = await api.post<AuthResponse>('/auth/login', credentials);
  return response.data;
};

export const registerUser = async (payload: RegisterPayload) => {
  const response = await api.post<AuthResponse>('/auth/register', payload);
  return response.data;
  };

export const fetchProfile = async () => {
  const response = await api.get<ProfileResponse>('/auth/profile');
  return response.data;
};