// src/lib/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // 1. Pasang Token
    const token = localStorage.getItem('posko_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Integrasi Bahasa Backend
    // Backend membaca header 'accept-language'. Default ke 'id'.
    const lang = localStorage.getItem('posko_lang') || 'id';
    config.headers['Accept-Language'] = lang;
  }
  return config;
});

export default api;