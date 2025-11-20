// src/features/auth/types.ts
export type Role = 'customer' | 'provider' | 'admin';

export interface User {
  userId: string;
  fullName: string;
  email: string;
  roles: Role[];
  activeRole: Role;
  profilePictureUrl?: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  messageKey: string;
  message: string;
  data: {
    tokens: Tokens;
    profile: User;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role?: Extract<Role, 'customer' | 'provider'>;
}