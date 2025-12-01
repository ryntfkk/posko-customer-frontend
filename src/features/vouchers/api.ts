import api from '@/lib/axios';
import { 
  VoucherListResponse, 
  CheckVoucherPayload, 
  CheckVoucherResponse,
  ClaimVoucherResponse 
} from './types';

export const voucherApi = {
  // [BARU] Marketplace: Ambil daftar voucher yang BELUM diklaim
  getAvailableVouchers: async (): Promise<VoucherListResponse> => {
    const response = await api.get('/vouchers/available');
    return response.data;
  },

  // [MODIFIKASI] Voucher Saya: Ambil daftar yang SUDAH diklaim
  getMyVouchers: async (): Promise<VoucherListResponse> => {
    const response = await api.get('/vouchers/my');
    return response.data;
  },

  // [BARU] Klaim Voucher
  claimVoucher: async (code: string): Promise<ClaimVoucherResponse> => {
    const response = await api.post('/vouchers/claim', { code });
    return response.data;
  },

  // Cek validitas voucher (Payload updated support items)
  checkVoucher: async (payload: CheckVoucherPayload): Promise<CheckVoucherResponse> => {
    const response = await api.post('/vouchers/check', payload);
    return response.data;
  },
};