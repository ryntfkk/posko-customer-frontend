// src/features/vouchers/api.ts
import api from '@/lib/axios';
import { Voucher, UserVoucher, CheckVoucherPayload, CheckVoucherResponse } from './types';

export const voucherApi = {
  // Get Market/Available Vouchers
  getAvailableVouchers: async () => {
    const response = await api.get<{ message: string; data: Voucher[] }>('/vouchers/available');
    return response.data;
  },

  // Get My Vouchers (Claimed)
  getMyVouchers: async () => {
    // [FIXED] Endpoint disesuaikan dengan backend routes.js ('/my' bukan '/my-vouchers')
    const response = await api.get<{ message: string; data: Voucher[] }>('/vouchers/my'); 
    return response.data;
  },

  // Claim Voucher
  claimVoucher: async (code: string) => {
    const response = await api.post<{ message: string; data: any }>('/vouchers/claim', { code });
    return response.data;
  },

  // [UPDATE] Check Voucher Logic
  checkVoucher: async (payload: CheckVoucherPayload) => {
    const response = await api.post<{ message: string; data: CheckVoucherResponse }>('/vouchers/check', payload);
    return response.data;
  }
};