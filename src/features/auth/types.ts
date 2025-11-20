// src/features/auth/types.ts
export type Role = 'customer' | 'provider' | 'admin';

export interface Address {
  province: string;
  district: string;
  city: string;
  village: string;
  postalCode: string;
  detail: string;
}

export interface GeoLocation {
  type: 'Point';
  coordinates: number[];
}

export interface User {
  userId: string;
  fullName: string;
  email: string;
  roles: Role[];
  activeRole: Role;
  phoneNumber?: string;
  birthDate?: string; 
  address?: Address;
  location?: GeoLocation; 
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
  phoneNumber: string;
  birthDate: string;
  gender: string;
  roles: Role[];
  address: Address;
  location?: GeoLocation;
}