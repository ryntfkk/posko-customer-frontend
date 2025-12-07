import axios from '@/lib/axios';
import { CreateOrderPayload, OrderListResponse, OrderResponse, OrderStatus } from './types';

// Fetch single order
export const fetchOrderById = async (orderId: string): Promise<OrderResponse> => {
  const { data } = await axios.get(`/orders/${orderId}`);
  return data;
};

// List orders (Updated with Pagination)
export const listOrders = async (
  view?: 'customer' | 'provider', 
  page: number = 1, 
  limit: number = 10
): Promise<OrderListResponse> => {
  const params = {
    ...(view ? { view } : {}),
    page,
    limit
  };
  const { data } = await axios.get('/orders', { params });
  return data;
};

// Create new order
export const createOrder = async (payload: CreateOrderPayload): Promise<OrderResponse> => {
  const { data } = await axios.post('/orders', payload);
  return data;
};

// Update status
export const updateOrderStatus = async (
  orderId: string, 
  status: OrderStatus
): Promise<OrderResponse> => {
  const { data } = await axios.patch(`/orders/${orderId}/status`, { status });
  return data;
};

// Reject Additional Fee
export const rejectAdditionalFee = async (orderId: string, feeId: string): Promise<OrderResponse> => {
  const { data } = await axios.put(`/orders/${orderId}/fees/${feeId}/reject`);
  return data;
};