// src/lib/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://posko-backend.vercel.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. REQUEST INTERCEPTOR (Pasang Token & Bahasa)
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Pasang Token
      const token = localStorage.getItem('posko_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Integrasi Bahasa
      const lang = localStorage.getItem('posko_lang') || 'id';
      config.headers['Accept-Language'] = lang;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 2. [BARU] RESPONSE INTERCEPTOR (Handle Token Expired)
api.interceptors.response.use(
  (response) => {
    // Jika sukses, kembalikan respons apa adanya
    return response;
  },
  (error) => {
    // Cek apakah error response ada dan statusnya 401 (Unauthorized)
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        // 1. Hapus token yang sudah tidak valid/kadaluwarsa
        localStorage.removeItem('posko_token');
        
        // 2. Redirect paksa ke halaman login
        // Kita gunakan window.location agar state aplikasi benar-benar ter-reset
        // Cek agar tidak looping redirect jika sudah di halaman login
        if (!window.location.pathname.startsWith('/login')) {
            alert("Sesi Anda telah berakhir. Silakan login kembali.");
            window.location.href = '/login';
        }
      }
    }
    
    // Lemparkan error kembali agar bisa di-catch oleh komponen (jika perlu handling khusus selain 401)
    return Promise.reject(error);
  }
);

export default api;