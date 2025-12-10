import axios from 'axios';

// --- KONFIGURASI INSTANCE AXIOS ---
const api = axios. create({
  // [FIX] Menggunakan endpoint proxy lokal untuk menghindari CORS
  // Request ke '/api/proxy/.. .' akan diteruskan Next.js ke 'https://api.poskojasa.com/api/.. .'
  baseURL: '/api/proxy',
  timeout:  30000,
  // Content-Type dibiarkan kosong agar otomatis diset (penting untuk FormData/Upload)
});

// --- STATE UNTUK QUEUE REFRESH TOKEN ---
let isRefreshing = false;
let failedQueue:  Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token:  string | null = null) => {
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
      const token = localStorage. getItem('posko_token');
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
    const originalRequest = error. config;

    // Jika error 401 Unauthorized dan belum pernah diretry
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // 1. Jika sedang refreshing, masukkan request ke antrian
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue. push({ resolve, reject });
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

        // [FIX] Buat axios instance tanpa interceptor untuk refresh token
        // Gunakan endpoint proxy yang sudah dikonfigurasi di next.config.mjs
        const refreshAxios = axios.create({
          baseURL: '/api/proxy',
          timeout: 30000,
        });

        const response = await refreshAxios.post(
          '/auth/refresh-token',
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;

        // Simpan token baru
        localStorage. setItem('posko_token', accessToken);
        localStorage.setItem('posko_refresh_token', newRefreshToken);
        
        // Update default header instance
        api.defaults.headers. common['Authorization'] = `Bearer ${accessToken}`;

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
        
        // Redirect ke login
        if (typeof window !== 'undefined' && !window.location.pathname. startsWith('/login')) {
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