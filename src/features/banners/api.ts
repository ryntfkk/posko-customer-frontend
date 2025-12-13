import api from '@/lib/axios';
import { BannerResponse } from './types';

export const bannerApi = {
  // Mengambil list banner yang aktif untuk ditampilkan di Home
  getActiveBanners: async (): Promise<BannerResponse> => {
    const response = await api.get('/banners', {
      params: { 
        isActive: true 
      }
    });
    return response.data;
  },
};