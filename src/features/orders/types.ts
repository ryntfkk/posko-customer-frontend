import { User } from "../auth/types";
import { Service } from "../services/types";

export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface OrderItem {
  serviceId: string | Service; // Bisa ID atau Object populate
  serviceName: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  userId: string | User;
  providerId?: string | User; // Opsional jika basic order
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  address: {
    detail: string;
    city: string;
    // tambahkan field lain sesuai backend nanti
  };
  createdAt: string;
}

export interface CreateOrderPayload {
  providerId?: string; // Jika direct order
  items: {
    serviceId: string;
    quantity: number;
  }[];
  totalAmount: number; // Opsional, tergantung backend hitung sendiri atau tidak
  address: string; // Atau object address lengkap
}