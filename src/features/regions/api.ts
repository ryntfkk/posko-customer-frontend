import api from '@/lib/axios';

// Definisi tipe data sesuai dengan struktur database MongoDB Anda
export interface Region {
  id: string;
  name: string;
  type: 'province' | 'regency' | 'district' | 'village';
  parentId?: string | null;
}

// Definisi respons standar dari backend
export interface RegionResponse {
  success: boolean;
  data: Region[];
}

/**
 * Mengambil daftar semua provinsi
 * Endpoint: GET /regions/provinces
 */
export const fetchProvinces = async (): Promise<RegionResponse> => {
  const response = await api.get('/regions/provinces');
  return response.data;
};

/**
 * Mengambil daftar wilayah anak berdasarkan parentId
 * (Misal: ID Provinsi -> Daftar Kota/Kabupaten)
 * (Misal: ID Kota -> Daftar Kecamatan)
 * (Misal: ID Kecamatan -> Daftar Kelurahan)
 * Endpoint: GET /regions/children/:parentId
 */
export const fetchRegionChildren = async (parentId: string): Promise<RegionResponse> => {
  const response = await api.get(`/regions/children/${parentId}`);
  return response.data;
};