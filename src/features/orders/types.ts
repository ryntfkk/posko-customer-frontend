// src/features/orders/types.ts
import { Address } from "../auth/types";

export interface OrderItemPayload {
  serviceId: string;
  name: string;
  quantity: number;
  price: number;
  note?: string;
}

export interface CreateOrderPayload {
  orderType: 'direct' | 'basic';
  providerId?: string | null;
  totalAmount: number;
  items: OrderItemPayload[];
  scheduledAt: string;
  shippingAddress: Address; 
  location: { 
    type: 'Point', 
    coordinates: number[];
  };
}

// [FIX] Tambahkan type yang lebih lengkap untuk Order Item yang dipopulate
export interface PopulatedOrderItem {
  serviceId: {
    _id: string;
    name: string;
    iconUrl?: string;
    category?: string;
  } | null;
  name: string;
  quantity: number;
  price: number;
  note?: string;
}

// [FIX] Tambahkan type untuk Provider yang dipopulate
export interface PopulatedProvider {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    phoneNumber?: string;
    profilePictureUrl?: string;
  };
  rating?: number;
  isOnline?: boolean;
}

// [FIX] Tambahkan type untuk User yang dipopulate
export interface PopulatedUser {
  _id: string;
  fullName: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
}

// [FIX] Type Order yang lebih lengkap
export type OrderStatus = 
  | 'pending' 
  | 'paid' 
  | 'searching' 
  | 'accepted' 
  | 'on_the_way' 
  | 'working' 
  | 'waiting_approval' 
  | 'completed' 
  | 'cancelled' 
  | 'failed';

export interface Order {
  _id: string;
  userId: string | PopulatedUser;
  providerId?: string | PopulatedProvider | null;
  items: PopulatedOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  orderType: 'direct' | 'basic';
  scheduledAt?: string;
  
  // [FIX] Tambahkan field yang disimpan di Order
  shippingAddress?: Address;
  location?: {
    type: 'Point';
    coordinates: number[];
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface OrderResponse {
  messageKey: string;
  message: string;
  data: Order;
}

export interface OrderListResponse {
  messageKey?: string;
  message?: string;
  data: Order[];
}