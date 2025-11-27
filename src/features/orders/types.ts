// src/features/orders/types.ts
import { Address } from "../auth/types"; // Import Address type dari auth/types

// Payload untuk item pesanan
export interface OrderItemPayload {
  serviceId: string;
  name: string;
  quantity: number;
  price: number;
  note?: string;
}

// Payload utama untuk membuat pesanan
export interface CreateOrderPayload {
  orderType: 'direct' | 'basic';
  providerId?: string | null;
  totalAmount: number;
  items: OrderItemPayload[];
  
  // [BARU] Tanggal Kunjungan (Wajib)
  scheduledAt: string; // ISO Date String

  // [BARU] Alamat Kunjungan (untuk dikirim ke backend)
  shippingAddress: Address; 
  location: { 
    type: 'Point', 
    coordinates: number[]; // [Longitude, Latitude] 
  };
}

export interface Order {
  _id: string;
  userId: string;
  providerId?: string | null;
  items: any[];
  totalAmount: number;
  status: string; 
  orderType: 'direct' | 'basic';
  
  // [BARU]
  scheduledAt?: string; 
  
  createdAt: string;
  updatedAt: string;
}

// Response dari backend
export interface OrderResponse {
  messageKey: string;
  message: string;
  data: Order;
}