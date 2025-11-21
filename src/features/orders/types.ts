// src/features/orders/types.ts

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
}

// [PERBAIKAN] Definisi Order ditambahkan kembali untuk mencegah error di api.ts
export interface Order {
  _id: string;
  userId: string;
  providerId?: string | null;
  items: any[];
  totalAmount: number;
  status: string; // pending, searching, accepted, dll
  orderType: 'direct' | 'basic';
  createdAt: string;
  updatedAt: string;
}

// Response dari backend
export interface OrderResponse {
  messageKey: string;
  message: string;
  data: Order;
}