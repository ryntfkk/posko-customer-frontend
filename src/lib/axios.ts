import axios from 'axios';

// --- KONFIGURASI INSTANCE AXIOS ---
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.poskojasa.com/api',
  timeout: 30000,
  // [FIX] Jangan set Content-Type default di sini agar tidak mengganggu upload FormData (gambar)
  // Axios akan otomatis mengatur Content-Type: application/json untuk object biasa
});

// --- STATE UNTUK QUEUE REFRESH TOKEN ---
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      if (token) prom.resolve(token);
    }
  });

  failedQueue = [];
};

// --- REQUEST INTERCEPTOR ---
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('posko_token');
      const lang = localStorage.getItem('posko_lang') || 'id';

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Kirim header Accept-Language
      config.headers['Accept-Language'] = lang;

    } catch (e) {
      console.error('Error accessing localStorage:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- RESPONSE INTERCEPTOR ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Jika error 401 Unauthorized dan belum pernah diretry
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // 1. Jika sedang refreshing, masukkan request ke antrian
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // 2. Jika belum refreshing, mulai proses refresh
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('posko_refresh_token');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Panggil endpoint refresh token
        // Gunakan axios create baru tanpa interceptor untuk menghindari loop
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh-token`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;

        // Simpan token baru
        localStorage.setItem('posko_token', accessToken);
        localStorage.setItem('posko_refresh_token', newRefreshToken);
        
        // Update default header instance untuk request selanjutnya
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        // Proses antrian yang menunggu dengan token baru
        processQueue(null, accessToken);

        // Ulangi request original yang gagal tadi
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // Jika gagal refresh (token expired/invalid), reject semua antrian
        processQueue(refreshError, null);
        
        // Bersihkan storage
        localStorage.removeItem('posko_token');
        localStorage.removeItem('posko_refresh_token');
        
        // Redirect ke login jika belum di sana
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
           // Menggunakan window.location agar halaman refresh total dan state bersih
           window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;