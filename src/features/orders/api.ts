// src/features/orders/api.ts
import api from '@/lib/axios';
import { CreateOrderPayload } from './types';

export const createOrder = async (payload: CreateOrderPayload) => {
  try {
    const response = await api.post('/orders', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const getOrder = async (orderId: string) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};

export const fetchOrderById = async (orderId: string) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    throw error;
  }
};

export const listOrders = async (view?: string) => {
  try {
    const params = view ? `?view=${view}` : '';
    const response = await api.get(`/orders${params}`);
    return response.data;
  } catch (error) {
    console.error('Error listing orders:', error);
    throw error;
  }
};

// PERBAIKAN: Hapus parameter yang tidak perlu
export const fetchMyOrders = async () => {
  try {
    const response = await api.get('/orders');
    return response.data;
  } catch (error) {
    console.error('Error fetching my orders:', error);
    throw error;
  }
};

// PERBAIKAN: Hapus parameter yang tidak perlu
export const fetchIncomingOrders = async () => {
  try {
    const response = await api.get('/orders/incoming');
    return response.data;
  } catch (error) {
    console.error('Error fetching incoming orders:', error);
    throw error;
  }
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    const response = await api.patch(`/orders/${orderId}/status`, { status });
    return response.data;
  } catch (error) {
    console. error('Error updating order status:', error);
    throw error;
  }
};

export const acceptOrder = async (orderId: string) => {
  try {
    const response = await api.patch(`/orders/${orderId}/accept`, {});
    return response.data;
  } catch (error) {
    console.error('Error accepting order:', error);
    throw error;
  }
};