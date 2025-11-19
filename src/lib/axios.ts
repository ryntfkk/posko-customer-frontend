import axios from 'axios';

// 1. Buat instance axios yang mengarah ke Backend Anda
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Pasang "Interceptor" (Satpam)
// Setiap kali request dikirim, cek apakah ada token di saku (localStorage)
// Jika ada, tempelkan token tersebut ke header request.
api.interceptors.request.use((config) => {
  // Kita cek apakah kode ini jalan di browser (bukan di server Next.js)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('posko_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;