import api from '@/lib/axios';
import { AuthResponse, LoginPayload, ProfileResponse, RegisterPayload } from './types';

// [HELPER] Cookie Management
function setAuthCookie(token: string) {
  document.cookie = `posko_token=${token}; path=/; max-age=604800; SameSite=Lax`;
}

function removeAuthCookie() {
  document.cookie = `posko_token=; path=/; max-age=0; SameSite=Lax`;
}

function safeSetToken(token: string): boolean {
  try {
    localStorage.setItem('posko_token', token);
    setAuthCookie(token);
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
    localStorage.removeItem('posko_token');
    localStorage.removeItem('posko_refresh_token');
    removeAuthCookie();
  } catch (e) {
    console.error('Failed to remove token:', e);
  }
}

export const loginUser = async (credentials: LoginPayload) => {
  const response = await api.post<AuthResponse>('/auth/login', credentials);
  
  if (response.data.data.tokens) {
    safeSetToken(response.data.data.tokens.accessToken);
    try {
      localStorage.setItem('posko_refresh_token', response.data.data.tokens.refreshToken);
    } catch (e) {
      console.error('Failed to save refresh token:', e);
    }
  }
  
  return response.data;
};

export const registerUser = async (payload: RegisterPayload) => {
  const response = await api.post<AuthResponse>('/auth/register', payload);
  
  if (response.data.data.tokens) {
    safeSetToken(response.data.data.tokens.accessToken);
    try {
      localStorage.setItem('posko_refresh_token', response.data.data.tokens.refreshToken);
    } catch (e) {
      console.error('Failed to save refresh token:', e);
    }
  }
  
  return response.data;
};

export const fetchProfile = async () => {
  const response = await api.get<ProfileResponse>('/auth/profile');
  return response.data;
};

export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = localStorage.getItem('posko_refresh_token');
    if (!refreshToken) return null;

    const response = await api.post<AuthResponse>('/auth/refresh-token', { refreshToken });
    
    if (response.data.data.tokens) {
      safeSetToken(response.data.data.tokens.accessToken);
      localStorage.setItem('posko_refresh_token', response.data.data.tokens.refreshToken);
      return response.data.data.tokens.accessToken;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    safeRemoveToken();
    return null;
  }
};

export const logoutUser = async () => {
  try {
    // Logout backend (opsional)
    // await api.post('/auth/logout', { refreshToken }); 
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    safeRemoveToken();
  }
};

export const logout = logoutUser; 

export const updateProfile = async (data: any) => {
    const response = await api.put<ProfileResponse>('/auth/profile', data);
    return response.data;
};

// [NEW] Added missing exports for Role Management
export const switchRole = async (role: string) => {
  const response = await api.post('/auth/switch-role', { role });
  return response.data;
};

export const registerPartner = async () => {
  const response = await api.post('/auth/register-partner');
  return response.data;
};

export const isAuthenticated = (): boolean => {
  return !!safeGetToken();
};

export const getToken = (): string | null => {
  return safeGetToken();
};