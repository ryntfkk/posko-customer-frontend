// src/features/services/types.ts
export interface Service {
  _id: string;
  name: string;
  description?: string;
  category: string;
  basePrice: number;
  iconUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceCreatePayload {
  name: string;
  description?: string;
  category: string;
  basePrice: number;
  iconUrl?: string;
}