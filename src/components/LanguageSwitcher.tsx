// src/components/LanguageSwitcher.tsx
'use client';

import { useState, useEffect } from 'react';

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const [lang, setLang] = useState('id');

  useEffect(() => {
    // Ambil bahasa saat ini dari localStorage saat komponen dimuat
    const savedLang = localStorage.getItem('posko_lang');
    
    // Cek apakah ada preference bahasa tersimpan yang berbeda dari default ('id')
    if (savedLang === 'en') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLang('en');
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = lang === 'id' ? 'en' : 'id';
    
    // 1. Simpan ke localStorage
    localStorage.setItem('posko_lang', newLang);
    setLang(newLang);

    // 2. Reload halaman agar konfigurasi Axios diperbarui secara global
    window.location.reload();
  };

  return (
    <button
      onClick={toggleLanguage}
      // Kita menghapus 'fixed bottom-...' dan menggantinya dengan styling button standar yang rapi.
      // Class 'className' dari props ditambahkan di akhir agar parent bisa override posisi (misal: absolute top-4 right-4).
      className={`flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-300 group ${className}`}
      title={lang === 'id' ? 'Ganti Bahasa' : 'Change Language'}
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