// src/features/auth/types.ts

export interface User {
  userId: string;
  fullName: string;
  email: string;
  roles: ('customer' | 'provider' | 'admin')[];
  activeRole: 'customer' | 'provider' | 'admin';
  profilePictureUrl?: string;
}

export interface LoginResponse {
  messageKey: string;
  message: string;
  data: {
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
    profile: User;
  };
}