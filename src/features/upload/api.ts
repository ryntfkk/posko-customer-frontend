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

    // [FIX] Mengubah endpoint '/uploads' menjadi '/upload' (singular)
    // Sesuai dengan route di backend: app.use('/api/upload', ...) di src/index.js
    // Kami juga menambahkan header eksplisit untuk memastikan boundary FormData terkirim dengan benar
    const response = await api.post<UploadResponse>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data', 
      },
    });
    
    // Validasi response structure untuk menghindari crash jika data dari server tidak sesuai
    if (!response.data || !response.data.data || !response.data.data.url) {
      throw new Error('Invalid response from server during upload');
    }

    // Mengembalikan full URL dari S3
    return response.data.data.url;
  },
};