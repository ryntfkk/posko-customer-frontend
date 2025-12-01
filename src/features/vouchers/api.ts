import api from '@/lib/axios';
import { VoucherListResponse, CheckVoucherPayload, CheckVoucherResponse } from './types';

export const voucherApi = {
  // Mendapatkan daftar voucher yang tersedia untuk user
  getMyVouchers: async (): Promise<VoucherListResponse> => {
    const response = await api.get('/vouchers');
    return response.data;
  },

  // Cek validitas voucher dan hitung estimasi diskon
  checkVoucher: async (payload: CheckVoucherPayload): Promise<CheckVoucherResponse> => {
    const response = await api.post('/vouchers/check', payload);
    return response.data;
  },
};