import api from '@/lib/axios';
import { CreateOrderPayload, Order } from './types';

// Buat Pesanan Baru
export const createOrder = async (payload: CreateOrderPayload) => {
  const response = await api.post<{ message: string; data: Order }>('/orders', payload);
  return response.data;
};

// Ambil Pesanan (Untuk Customer)
export const fetchMyOrders = async () => {
  const response = await api.get<{ data: Order[] }>('/orders/my-orders');
  return response.data;
};

// Ambil Pesanan Masuk (Untuk Provider)
export const fetchIncomingOrders = async () => {
  const response = await api.get<{ data: Order[] }>('/orders/incoming');
  return response.data;
};

// Update Status Pesanan (Terima/Tolak/Selesai)
export const updateOrderStatus = async (orderId: string, status: string) => {
  const response = await api.patch<{ data: Order }>(`/orders/${orderId}/status`, { status });
  return response.data;
};
