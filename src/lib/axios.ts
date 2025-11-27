import axios from 'axios';

const api = axios.create({
  baseURL: 'https://posko-backend.vercel.app/api', // Fixed URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent infinite loop refresh token
let isRefreshing = false;
let failedQueue: { resolve: (value: any) => void; reject: (reason?: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  isRefreshing = false;
  failedQueue = [];
};

// 1. REQUEST INTERCEPTOR
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Attach Token
      const token = localStorage.getItem('posko_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Language Integration
      const lang = localStorage.getItem('posko_lang') || 'id';
      config.headers['Accept-Language'] = lang;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 2. RESPONSE INTERCEPTOR (Handle Token Expired + Auto Refresh)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (typeof window !== 'undefined') {
        if (originalRequest._retry) {
          localStorage.removeItem('posko_token');
          localStorage.removeItem('posko_refresh_token');
          localStorage.removeItem('userId');
          
          if (!window.location.pathname.startsWith('/login')) {
            alert('Sesi Anda telah berakhir. Silakan login kembali.');
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (token) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
              }
              return Promise.reject(error);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        isRefreshing = true;
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem('posko_refresh_token');
          
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await axios.post(
            'https://posko-backend.vercel.app/api/auth/refresh',
            { refreshToken },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          const { data } = response;
          
          if (data.data && data.data.tokens) {
            const newAccessToken = data.data.tokens.accessToken;
            const newRefreshToken = data.data.tokens.refreshToken;

            localStorage.setItem('posko_token', newAccessToken);
            localStorage.setItem('posko_refresh_token', newRefreshToken);

            api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            processQueue(null, newAccessToken);

            return api(originalRequest);
          } else {
            throw new Error('Invalid token response');
          }
        } catch (refreshError) {
          localStorage.removeItem('posko_token');
          localStorage.removeItem('posko_refresh_token');
          localStorage.removeItem('userId');

          processQueue(refreshError, null);

          if (!window.location.pathname.startsWith('/login')) {
            alert('Sesi Anda telah berakhir. Silakan login kembali.');
            window.location.href = '/login';
          }

          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;