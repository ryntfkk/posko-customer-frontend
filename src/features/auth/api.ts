// src/features/auth/api.ts
import api from '@/lib/axios';
import { AuthResponse, LoginPayload, ProfileResponse, RegisterPayload } from './types';

// [HELPER] Safe localStorage access
function safeSetToken(token: string): boolean {
  try {
    localStorage.setItem('posko_token', token);
    return true;
  } catch (e) {
    console.error('Failed to save token:', e);
    return false;
  }
}

function safeGetToken(): string | null {
  try {
    return localStorage.getItem('posko_token');
  } catch (e) {
    console.error('Failed to get token:', e);
    return null;
  }
}

function safeRemoveToken(): void {
  try {
    localStorage. removeItem('posko_token');
    localStorage.removeItem('posko_refresh_token');
  } catch (e) {
    console. error('Failed to remove token:', e);
  }
}

export const loginUser = async (credentials: LoginPayload) => {
  const response = await api.post<AuthResponse>('/auth/login', credentials);
  
  // [FIX] Simpan token dengan error handling
  if (response.data.data.tokens) {
    safeSetToken(response.data.data. tokens.accessToken);
    try {
      localStorage. setItem('posko_refresh_token', response. data.data.tokens.refreshToken);
    } catch (e) {
      console.error('Failed to save refresh token:', e);
    }
  }
  
  return response.data;
};

export const registerUser = async (payload: RegisterPayload) => {
  const response = await api. post<AuthResponse>('/auth/register', payload);
  
  // [FIX] Simpan token setelah register agar user langsung login
  if (response.data.data. tokens) {
    safeSetToken(response.data.data.tokens.accessToken);
    try {
      localStorage.setItem('posko_refresh_token', response.data.data. tokens.refreshToken);
    } catch (e) {
      console.error('Failed to save refresh token:', e);
    }
  }
  
  return response. data;
};

export const fetchProfile = async () => {
  const response = await api.get<ProfileResponse>('/auth/profile');
  return response.data;
};

// [NEW] Refresh token
export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = localStorage.getItem('posko_refresh_token');
    if (! refreshToken) return null;

    const response = await api.post<AuthResponse>('/auth/refresh-token', { refreshToken });
    
    if (response.data. data.tokens) {
      safeSetToken(response.data.data.tokens. accessToken);
      localStorage.setItem('posko_refresh_token', response.data. data.tokens.refreshToken);
      return response.data. data.tokens.accessToken;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    safeRemoveToken();
    return null;
  }
};

// [NEW] Logout
export const logoutUser = async () => {
  try {
    const refreshToken = localStorage.getItem('posko_refresh_token');
    await api.post('/auth/logout', { refreshToken });
  } catch (error) {
    console. error('Logout error:', error);
  } finally {
    safeRemoveToken();
  }
};

export const switchRole = async (targetRole: 'customer' | 'provider') => {
  const response = await api.post<AuthResponse>('/auth/switch-role', { role: targetRole });
  
  if (response.data.data.tokens) {
    safeSetToken(response.data. data.tokens.accessToken);
  }
  
  return response.data;
};

export const registerPartner = async () => {
  const response = await api. post<AuthResponse>('/auth/register-partner', {});
  
  if (response.data.data.tokens) {
    safeSetToken(response.data. data.tokens.accessToken);
  }

  return response.data;
};

// [HELPER] Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!safeGetToken();
};

// [HELPER] Get current token
export const getToken = (): string | null => {
  return safeGetToken();
};