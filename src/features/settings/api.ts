import api from '@/lib/axios';
import { SettingsResponse } from './types';

export const settingsApi = {
  // Mengambil konfigurasi global (termasuk adminFee)
  getGlobalConfig: async (): Promise<SettingsResponse> => {
    const response = await api.get('/settings');
    return response.data;
  },
};