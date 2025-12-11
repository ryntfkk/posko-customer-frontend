import axios from 'axios';

// --- VALIDASI ENV URL ---
// Fungsi helper untuk memastikan URL API valid dan tidak menyebabkan crash
const getBaseUrl = () => {
  // 1. Ambil environment variable dan bersihkan spasi (trim)
  // Penting: .trim() mencegah error "Invalid URL" jika ada spasi di .env
  let url = process.env.NEXT_PUBLIC_API_URL?.trim();

  // 2. Jika env tidak ada, kosong, atau undefined, gunakan fallback hardcoded
  if (!url || url === '') {
    // Pastikan ini alamat Backend EC2 Anda yang benar (tanpa trailing slash)
    return 'https://api.poskojasa.com/api'; 
  }

  // 3. Validasi format URL agar tidak crash saat digunakan oleh Axios/URL constructor
  try {
    // Test construct URL, jika gagal akan masuk catch
    new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch (e) {
    console.error('⚠️ Malformed NEXT_PUBLIC_API_URL:', url, e);
    return 'https://api.poskojasa.com/api'; // Fallback aman
  }

  // 4. Hapus trailing slash jika tidak sengaja tertulis (misal: .../api/ -> .../api)
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }

  return url;
};

// --- KONFIGURASI INSTANCE AXIOS ---
const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: true, // Nyalakan jika menggunakan cookie, matikan jika token via header murni
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
      // Pastikan window tersedia (Client Side execution check)
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('posko_token');
        const lang = localStorage.getItem('posko_lang') || 'id';

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        if (config.headers) {
          config.headers['Accept-Language'] = lang;
        }
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
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
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
        // Ambil refresh token dari storage
        // Cek window dulu untuk keamanan SSR
        let refreshToken = null;
        if (typeof window !== 'undefined') {
          refreshToken = localStorage.getItem('posko_refresh_token');
        }
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Panggil endpoint refresh token menggunakan axios instance BARU (tanpa interceptor)
        // Gunakan getBaseUrl() agar konsisten
        const response = await axios.post(
          `${getBaseUrl()}/auth/refresh-token`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;

        // Simpan token baru
        if (typeof window !== 'undefined') {
          localStorage.setItem('posko_token', accessToken);
          localStorage.setItem('posko_refresh_token', newRefreshToken);
        }
        
        // Update default header instance untuk request selanjutnya
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        // Proses antrian yang menunggu dengan token baru
        processQueue(null, accessToken);

        // Ulangi request original yang gagal tadi
        if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);

      } catch (refreshError) {
        // Jika gagal refresh (token expired/invalid), reject semua antrian
        processQueue(refreshError, null);
        
        // Bersihkan storage dan redirect ke login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('posko_token');
          localStorage.removeItem('posko_refresh_token');
          
          // Redirect jika user tidak sedang di halaman login/register
          if (!window.location.pathname.startsWith('/login') && 
              !window.location.pathname.startsWith('/register')) {
             window.location.href = '/login';
          }
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