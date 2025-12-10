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

    // [CORRECTION] Hapus prefix '/api'.
    // Axios baseURL sudah menyertakan '/api' (atau proxy yang mengarah ke sana).
    // Jadi '/upload' akan menjadi '.../api/upload' yang benar.
    const response = await api.post<UploadResponse>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Mengembalikan full URL dari S3 (req.file.location dari backend)
    return response.data.data.url;
  },
};