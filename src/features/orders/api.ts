import axios from '@/lib/axios';
import { CreateOrderPayload, Order, OrderListResponse, OrderResponse, OrderStatus } from './types';

// Fetch single order
export const fetchOrderById = async (orderId: string): Promise<OrderResponse> => {
  const { data } = await axios.get(`/orders/${orderId}`);
  return data;
};

// List orders
export const listOrders = async (view?: 'customer' | 'provider'): Promise<OrderListResponse> => {
  const params = view ? { view } : {};
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

// [BARU] Reject Additional Fee
export const rejectAdditionalFee = async (orderId: string, feeId: string): Promise<OrderResponse> => {
  // Asumsi route endpoint sesuai dengan controller params
  // Anda mungkin perlu menambahkan route ini di backend: router.put('/:orderId/fees/:feeId/reject', controller.rejectAdditionalFee)
  const { data } = await axios.put(`/orders/${orderId}/fees/${feeId}/reject`);
  return data;
};