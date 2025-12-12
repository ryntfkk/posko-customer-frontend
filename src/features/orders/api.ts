// src/features/orders/api.ts
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

// Create new order (Updated for S3 Upload & JSON Serialization)
export const createOrder = async (payload: CreateOrderPayload): Promise<OrderResponse> => {
  // Cek apakah ada file yang perlu diupload di attachments (bypass type checking dengan any)
  const attachments = (payload.attachments as any[]) || [];
  const hasFile = attachments.some((att: any) => att.file instanceof File);

  if (hasFile) {
    const formData = new FormData();

    // 1. Append Attachments (Files)
    attachments.forEach((att: any) => {
        if (att.file instanceof File) {
            formData.append('attachments', att.file);
        }
    });

    // 2. Append Data Fields (Stringify Object/Array agar terbaca Validator Backend)
    (Object.keys(payload) as (keyof CreateOrderPayload)[]).forEach(key => {
        if (key === 'attachments') return; // Skip attachments yang sudah diproses

        const value = payload[key];
        
        if (value === undefined || value === null) return;

        if (typeof value === 'object' && !(value instanceof Date)) {
            // Serialize Object/Array ke JSON String (misal: items, address, dll)
            // Ini penting agar backend menerima { items: [...] } bukan pecahan form data
            formData.append(key, JSON.stringify(value));
        } else if (value instanceof Date) {
            formData.append(key, value.toISOString());
        } else {
            // Primitive values (number, string, boolean)
            formData.append(key, String(value));
        }
    });
    
    // Header Content-Type: multipart/form-data otomatis diatur oleh axios/browser
    const { data } = await axios.post('/orders', formData);
    return data;
  } else {
    // Gunakan JSON biasa jika tidak ada file (Backward Compatibility)
    const { data } = await axios.post('/orders', payload);
    return data;
  }
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