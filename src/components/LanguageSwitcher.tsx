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
    // Logika toggle: Jika ID ubah ke EN, jika EN ubah ke ID
    const newLang = lang === 'id' ? 'en' : 'id';
    
    // 1. Simpan ke localStorage agar dibaca oleh src/lib/axios.ts
    localStorage.setItem('posko_lang', newLang);
    setLang(newLang);

    // 2. Reload halaman agar konfigurasi Axios diperbarui dan request ulang ke backend
    window.location.reload();
  };

  return (
    <button
      onClick={toggleLanguage}
      className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full shadow-sm hover:shadow-md hover:bg-gray-50 transition-all group"
      title="Ganti Bahasa / Change Language"
    >
      <span className="text-xl leading-none">
        {lang === 'id' ? '🇮🇩' : '🇺🇸'}
      </span>
      <span className="text-sm font-bold text-gray-600 group-hover:text-red-600">
        {lang === 'id' ? 'ID' : 'EN'}
      </span>
    </button>
  );
}