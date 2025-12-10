import api from '@/lib/axios';

export interface UploadResponse {
  message: string;
  data: {
    url: string;
    key: string;
    mimetype: string;
    size: number;
  };
}

export const uploadApi = {
  /**
   * Upload single image to backend (S3)
   * @param file File object dari input type="file"
   * @returns Promise dengan data URL gambar
   */
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    // Header 'Content-Type': 'multipart/form-data' akan otomatis diset oleh browser/axios saat ada FormData
    // [FIX] Mengubah endpoint '/upload' menjadi '/uploads' agar sesuai dengan route backend umum
    const response = await api.post<UploadResponse>('/uploads', formData);
    
    // Mengembalikan full URL dari S3
    return response.data.data.url;
  },
};