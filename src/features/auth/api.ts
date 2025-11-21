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

// --- UPDATE: MENGGUNAKAN ENDPOINT REAL ---

export const switchRole = async (targetRole: 'customer' | 'provider') => {
  // Panggil endpoint backend
  const response = await api.post<AuthResponse>('/auth/switch-role', { role: targetRole });
  
  // Update token di localStorage dengan token baru dari backend
  if (response.data.data.tokens) {
    localStorage.setItem('posko_token', response.data.data.tokens.accessToken);
  }
  
  return response.data;
};

export const registerPartner = async () => {
  // Panggil endpoint backend untuk daftar jadi mitra
  const response = await api.post<AuthResponse>('/auth/register-partner', {});
  
  // Update token karena roles user berubah
  if (response.data.data.tokens) {
    localStorage.setItem('posko_token', response.data.data.tokens.accessToken);
  }

  return response.data;
};