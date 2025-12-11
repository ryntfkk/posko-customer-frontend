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

    try {
      // Menggunakan endpoint '/upload' sesuai route backend
      // Header Content-Type: multipart/form-data tidak perlu diset manual secara eksplisit di Axios terbaru
      // karena browser otomatis mengatur boundary-nya saat mendeteksi FormData.
      // Namun, jika ingin eksplisit, pastikan tidak merusak boundary.
      const response = await api.post<UploadResponse>('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Debugging: Log response dari server untuk memastikan formatnya
      // console.log('Upload Response:', response.data);

      // Validasi response structure yang lebih robust
      // Backend Anda mengembalikan: { message: "...", data: { url: "...", ... } }
      const responseData = response.data;
      
      if (responseData && responseData.data && responseData.data.url) {
        return responseData.data.url;
      }
      
      // Fallback check jika backend mengembalikan struktur flat (opsional)
      if ((responseData as any).url) {
        return (responseData as any).url;
      }

      console.error('Invalid Upload Response Structure:', responseData);
      throw new Error('Format respon server tidak dikenali saat upload.');

    } catch (error: any) {
      console.error('Upload Error Detail:', error.response?.data || error.message);
      // Lempar error yang lebih user-friendly
      throw new Error(error.response?.data?.message || 'Gagal mengupload gambar. Silakan coba lagi.');
    }
  },
};