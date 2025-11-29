// src/features/providers/types.ts
import { ServiceUnit } from "../services/types";

export interface ProviderServiceDetail {
  _id: string;
  name: string;
  category: string;
  iconUrl: string;
  basePrice: number;
  
  // [FIX] Properti tambahan agar sesuai dengan penggunaan di Checkout
  description?: string;
  shortDescription?: string;
  unit?: ServiceUnit;
  unitLabel?: string;
  displayUnit?: string;
  estimatedDuration?: number;
  includes?: string[];
  excludes?: string[];
  isPromo?: boolean;
  promoPrice?: number;
  discountPercent?: number;
}

export interface ProviderServiceItem {
  _id: string;
  serviceId: ProviderServiceDetail; 
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
  
  // Sistem Kalender
  blockedDates: string[]; // Tanggal yang diliburkan manual (ISO String)
  bookedDates?: string[]; // Tanggal yang penuh karena ada order (dari Backend)
}

export interface ProviderListResponse {
  messageKey: string;
  message: string;
  data: Provider[];
}