import axios from 'axios';

// --- KONFIGURASI INSTANCE AXIOS ---
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
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
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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
        // Kita pakai axios instance baru agar tidak kena interceptor ini lagi
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh-token`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;

        // Simpan token baru
        localStorage.setItem('posko_token', accessToken);
        localStorage.setItem('posko_refresh_token', newRefreshToken);
        
        // Update default header instance
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        // Proses antrian yang menunggu dengan token baru
        processQueue(null, accessToken);

        // Ulangi request original yang gagal tadi
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // Jika gagal refresh (token expired/invalid), reject semua antrian
        processQueue(refreshError, null);
        
        // Bersihkan storage dan redirect ke login
        localStorage.removeItem('posko_token');
        localStorage.removeItem('posko_refresh_token');
        
        // Hindari redirect loop jika sudah di halaman login
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
           window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        // Reset flag refreshing
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;