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
    // Note: Pastikan response backend untuk ini mengembalikan struktur yang sesuai dengan UserVoucher
    const response = await api.get<{ message: string; data: Voucher[] }>('/vouchers/my-vouchers'); 
    // Backend 'listMyVouchers' di code Anda mengembalikan formatted voucher (mirip Voucher tapi ada userVoucherId),
    // jadi return type di sini disesuaikan dengan kebutuhan UI.
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