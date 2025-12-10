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
    // Key 'image' ini harus sesuai dengan uploadS3.single('image') di backend
    formData.append('image', file);

    // [FIX] Menggunakan endpoint '/api/upload'
    // Jika axios baseURL adalah '/api/proxy', maka request akan ke '/api/proxy/api/upload'
    // Backend (setelah rewrite proxy) akan menerima '/api/upload' yang sudah kita buat di Langkah 1.
    const response = await api.post<UploadResponse>('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Mengembalikan full URL dari S3 (req.file.location dari backend)
    return response.data.data.url;
  },
};