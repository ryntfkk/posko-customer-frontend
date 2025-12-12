// src/features/orders/api.ts
import axios from '@/lib/axios';
import { CreateOrderPayload, OrderListResponse, OrderResponse, OrderStatus } from './types';

// Helper: Convert Object to FormData dengan Bracket Notation (untuk array/nested object)
// Backend Express + Multer biasanya bisa membaca format: items[0][serviceId]
const objectToFormData = (
  obj: any, 
  form?: FormData, 
  namespace?: string
): FormData => {
  const fd = form || new FormData();
  let formKey;

  for (const property in obj) {
    if (obj.hasOwnProperty(property)) {
      if (namespace) {
        formKey = namespace + '[' + property + ']';
      } else {
        formKey = property;
      }

      const value = obj[property];

      // Jika value adalah Date, convert ke ISO string
      if (value instanceof Date) {
        fd.append(formKey, value.toISOString());
      }
      // Jika value adalah array dan bukan File (karena File treated as object)
      else if (Array.isArray(value)) {
        // Khusus attachments yang punya File, kita append langsung sebagai file
        if (property === 'attachments' && !namespace) {
             value.forEach((att: any) => {
                 if (att.file instanceof File) {
                     fd.append('attachments', att.file);
                 }
                 // Metadata attachment (url/type/desc) bisa dikirim jika perlu,
                 // tapi backend controller kita saat ini men-generate URL dari S3.
                 // Jika ada description, kita bisa kirim sebagai array terpisah atau JSON string.
                 // Disini kita abaikan metadata url/type karena akan di-override S3.
             });
        } else {
             // Array biasa (seperti items), kita rekursif
             value.forEach((item, index) => {
                 objectToFormData(item, fd, `${formKey}[${index}]`);
             });
        }
      } 
      // Jika object biasa (bukan File), rekursif
      else if (typeof value === 'object' && !(value instanceof File) && value !== null) {
        objectToFormData(value, fd, formKey);
      } 
      // Value primitif (string, number, boolean)
      else {
        fd.append(formKey, value);
      }
    }
  }
  return fd;
};

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

// Create new order (Updated for File Upload)
export const createOrder = async (payload: CreateOrderPayload): Promise<OrderResponse> => {
  // Cek apakah ada file yang perlu diupload di attachments
  const hasFile = payload.attachments?.some((att: any) => att.file instanceof File);

  if (hasFile) {
    // Gunakan FormData jika ada file
    const formData = objectToFormData(payload);
    
    // Header 'Content-Type': 'multipart/form-data' biasanya otomatis diset oleh browser/axios 
    // saat mendeteksi FormData, tapi kita biarkan axios mengaturnya.
    const { data } = await axios.post('/orders', formData);
    return data;
  } else {
    // Gunakan JSON biasa jika tidak ada file (mempertahankan backward compatibility)
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