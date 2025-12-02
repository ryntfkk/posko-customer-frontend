// src/features/vouchers/api.ts
import api from '@/lib/axios';
import { Voucher, CheckVoucherPayload, CheckVoucherResponse } from './types';

export const voucherApi = {
  // Get Market/Available Vouchers
  getAvailableVouchers: async () => {
    const response = await api.get<{ message: string; data: Voucher[] }>('/vouchers/available');
    return response.data;
  },

  // Get My Vouchers (Claimed)
  getMyVouchers: async () => {
    // Endpoint sesuai backend routes
    const response = await api.get<{ message: string; data: Voucher[] }>('/vouchers/my'); 
    return response.data;
  },

  // Claim Voucher
  claimVoucher: async (code: string) => {
    const response = await api.post<{ message: string; data: any }>('/vouchers/claim', { code });
    return response.data;
  },

  // Check Voucher Logic
  checkVoucher: async (payload: CheckVoucherPayload) => {
    const response = await api.post<{ message: string; data: CheckVoucherResponse }>('/vouchers/check', payload);
    return response.data;
  }
};