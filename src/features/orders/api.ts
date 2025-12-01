import api from '@/lib/axios';
import { CreateOrderPayload, Order } from './types';

// Buat Pesanan Baru
export const createOrder = async (payload: CreateOrderPayload) => {
  const response = await api.post<{ message: string; data: Order }>('/orders', payload);
  return response.data;
};

// Fetch Orders (Customer View)
export const fetchMyOrders = async (view: 'customer' | 'provider' = 'customer') => {
  const response = await api.get<{ data: Order[] }>('/orders', {
    params: { view } 
  }); 
  return response.data;
};

// Update status (Misal: Customer membatalkan pesanan atau konfirmasi selesai)
export const updateOrderStatus = async (orderId: string, status: string) => {
  const response = await api.patch<{ message: string; data: Order }>(`/orders/${orderId}/status`, { status });
  return response.data;
};

// Ambil Detail Pesanan
export const fetchOrderById = async (orderId: string) => {
  const response = await api.get<{ data: Order }>(`/orders/${orderId}`);
  return response.data;
};