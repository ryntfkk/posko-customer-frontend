// src/features/providers/types.ts

export interface ProviderServiceDetail {
  _id: string;
  name: string;
  category: string;
  iconUrl: string;
  basePrice: number;
}

export interface ProviderServiceItem {
  _id: string;
  serviceId: ProviderServiceDetail; // Object karena dipopulate backend
  price: number;
  isActive: boolean;
}

export interface ProviderUser {
  _id: string;
  fullName: string;
  profilePictureUrl: string;
  bio: string;
  address?: {
    city?: string;
    district?: string;
    province?: string;
    detail?: string;
  };
  location?: {
    coordinates: number[]; // [Longitude, Latitude]
  };
}

export interface Provider {
  _id: string;
  userId: ProviderUser;
  services: ProviderServiceItem[];
  rating: number;
  isOnline: boolean;
  createdAt: string;
}

export interface ProviderListResponse {
  messageKey: string;
  message: string;
  data: Provider[];
}