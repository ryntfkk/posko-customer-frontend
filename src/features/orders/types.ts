// src/features/orders/types.ts
import { Address } from '../auth/types';

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
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface Order {
  _id: string;
  userId: string;
  providerId?: string | null;
  items: OrderItemPayload[];
  totalAmount: number;
  status: string;
  orderType: 'direct' | 'basic';
  scheduledAt?: string;
  shippingAddress?: Address;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrderResponse {
  messageKey?: string;
  message?: string;
  data: Order;
}