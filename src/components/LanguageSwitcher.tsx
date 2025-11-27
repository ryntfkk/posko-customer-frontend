'use client';

import { useState, useEffect } from 'react';

export default function LanguageSwitcher() {
  const [lang, setLang] = useState('id');

  useEffect(() => {
    // Ambil bahasa saat ini dari localStorage saat komponen dimuat
    const savedLang = localStorage.getItem('posko_lang') || 'id';
    setLang(savedLang);
  }, []);

  const toggleLanguage = () => {
    const newLang = lang === 'id' ? 'en' : 'id';
    
    // 1. Simpan ke localStorage
    localStorage.setItem('posko_lang', newLang);
    setLang(newLang);

    // 2. Reload halaman agar konfigurasi Axios diperbarui
    window.location.reload();
  };

  return (
    <button
      onClick={toggleLanguage}
      // PERBAIKAN POSISI:
      // 1. bottom-24 right-4: Pada HP, posisi agak naik (96px) agar tidak menutupi Bottom Nav
      // 2. lg:bottom-8 lg:right-8: Pada Laptop/PC, posisi standar di pojok kanan bawah
      className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-50 flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-md border border-gray-200 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-xl hover:scale-105 hover:bg-white transition-all duration-300 group"
      title="Ganti Bahasa / Change Language"
    >
      <span className="text-lg leading-none drop-shadow-sm">
        {lang === 'id' ? '🇮🇩' : '🇺🇸'}
      </span>
      <span className="text-xs font-bold text-gray-600 group-hover:text-red-600 transition-colors">
        {lang === 'id' ? 'ID' : 'EN'}
      </span>
    </button>
  );
}