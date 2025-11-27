export interface Address {
  province: string;
  city: string;
  district?: string;
  village?: string;
  postalCode?: string;
  detail: string;
}

export interface Location {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface User {
  _id: string;
  userId?: string;
  fullName: string;
  email: string;
  roles: string[];
  activeRole: 'customer' | 'provider' | 'admin';
  profilePictureUrl?: string;
  bannerPictureUrl?: string;
  bio?: string;
  birthDate?: string;
  gender?: string; // Added gender
  phoneNumber?: string;
  address?: Address;
  location?: Location;
  balance?: number;
  status?: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthData {
  tokens: Tokens;
  profile: User;
  userId?: string;
}

export interface AuthResponse {
  messageKey?: string;
  message?: string;
  data: AuthData;
}

export interface ProfileResponse {
  messageKey?: string;
  message?: string;
  data: {
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
  roles?: string[];
  activeRole?: string;
  address?: Address;
  location?: Location;
  profilePictureUrl?: string;
  bannerPictureUrl?: string;
  bio?: string;
  birthDate?: string;
  gender?: string; // Added gender to payload
  phoneNumber?: string;
  balance?: number;
  status?: string;
}

export interface Service {
  _id: string;
  name: string;
  description?: string;
  category: string;
  basePrice: number;
  iconUrl?: string;
}

export interface Provider {
  _id: string;
  userId: User;
  services: any[];
  rating: number;
}