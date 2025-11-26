// src/features/auth/api.ts
import api from '@/lib/axios';
import { AuthResponse, LoginPayload, ProfileResponse, RegisterPayload } from './types';

export const loginUser = async (credentials: LoginPayload) => {
  const response = await api.post<AuthResponse>('/auth/login', credentials);
  
  // Simpan token dan user info ke localStorage
  if (response.data.data.tokens) {
    localStorage. setItem('posko_token', response.data.data.tokens. accessToken);
    localStorage.setItem('posko_refresh_token', response.data.data.tokens.refreshToken);
  }
  
  // Simpan userId untuk digunakan di chat dan tempat lain
  if (response.data.data.userId) {
    localStorage.setItem('userId', response.data.data.userId);
  } else if (response.data.data.profile && response.data.data.profile._id) {
    localStorage.setItem('userId', response.data. data.profile._id);
  }
  
  return response. data;
};

export const registerUser = async (payload: RegisterPayload) => {
  const response = await api.post<AuthResponse>('/auth/register', payload);
  return response.data;
};

export const fetchProfile = async () => {
  const response = await api.get<ProfileResponse>('/auth/profile');
  return response.data;
};

export const switchRole = async (targetRole: 'customer' | 'provider') => {
  const response = await api.post<AuthResponse>('/auth/switch-role', { role: targetRole });
  
  if (response.data.data.tokens) {
    localStorage.setItem('posko_token', response. data.data.tokens.accessToken);
    localStorage.setItem('posko_refresh_token', response.data.data.tokens.refreshToken);
  }
  
  return response.data;
};

export const registerPartner = async () => {
  const response = await api.post<AuthResponse>('/auth/register-partner', {});
  
  if (response.data.data.tokens) {
    localStorage. setItem('posko_token', response.data.data.tokens. accessToken);
    localStorage.setItem('posko_refresh_token', response.data.data.tokens.refreshToken);
  }

  return response.data;
};