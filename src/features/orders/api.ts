// src/features/orders/api.ts
import api from '@/lib/axios';
import { CreateOrderPayload, OrderResponse } from './types';

export const createOrder = async (payload: CreateOrderPayload) => {
  const response = await api.post<OrderResponse>('/orders', payload);
  return response.data;
};

export const getOrder = async (orderId: string) => {
  const response = await api.get<OrderResponse>(`/orders/${orderId}`);
  return response. data;
};

export const listOrders = async (view?: string) => {
  const params = view ? `?view=${view}` : '';
  const response = await api.get(`/orders${params}`);
  return response.data;
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  const response = await api.patch<OrderResponse>(`/orders/${orderId}/status`, { status });
  return response.data;
};

export const acceptOrder = async (orderId: string) => {
  const response = await api.patch<OrderResponse>(`/orders/${orderId}/accept`, {});
  return response.data;
};