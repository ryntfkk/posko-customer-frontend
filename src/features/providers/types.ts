// src/features/providers/types.ts
import { ServiceUnit } from "../services/types";

export interface ProviderServiceDetail {
  _id: string;
  name: string;
  category: string;
  iconUrl: string;
  basePrice: number;
  
  // Properti tambahan agar sesuai dengan penggunaan di Checkout & Detail
  description?: string;
  shortDescription?: string;
  unit?: ServiceUnit;
  unitLabel?: string;
  displayUnit?: string;
  estimatedDuration?: number;
  includes?: string[];
  excludes?: string[];
  requirements?: string[];
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
  phoneNumber?: string;
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
  
  // [BARU] Portfolio/Dokumentasi
  portfolioImages?: string[]; // URL gambar hasil kerja
  
  // [BARU] Statistik
  totalCompletedOrders?: number;
  
  // [PERBAIKAN] Jarak dari user (dihitung oleh backend via geo-spatial query)
  // Property ini hanya ada ketika parameter lat/lng dikirim ke API
  distance?: number; // Dalam meter
}

export interface ProviderListResponse {
  messageKey: string;
  message: string;
  data: Provider[];
}