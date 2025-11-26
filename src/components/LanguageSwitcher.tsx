// src/components/LanguageSwitcher. tsx
'use client';

import { useEffect, useState } from 'react';

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const [currentLang, setCurrentLang] = useState<string>('id');
  const [isOpen, setIsOpen] = useState(false);

  // =====================================================================
  // EFFECT: Load language dari localStorage
  // =====================================================================
  useEffect(() => {
    const savedLang = localStorage.getItem('posko_lang') || 'id';
    setCurrentLang(savedLang);

    // Apply language ke HTML lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = savedLang;
    }
  }, []);

  // =====================================================================
  // HANDLER: Change language
  // =====================================================================
  const handleChangeLanguage = (lang: 'id' | 'en') => {
    // Simpan ke localStorage
    localStorage.setItem('posko_lang', lang);
    setCurrentLang(lang);

    // Update HTML lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }

    // Trigger custom event agar komponen lain bisa mendengarkan
    if (typeof window !== 'undefined') {
      window. dispatchEvent(
        new CustomEvent('languageChange', { detail: { lang } })
      );
    }

    setIsOpen(false);
    
    // Reload halaman untuk apply perubahan bahasa di semua tempat
    // (Untuk implementasi i18n yang lebih advanced, gunakan library seperti next-intl)
    window.location. reload();
  };

  const languages = [
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ];

  const selectedLang = languages.find(lang => lang.code === currentLang) || languages[0];

  return (
    <div className={`relative ${className}`}>
      {/* Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
        title="Pilih Bahasa"
      >
        <span className="text-lg">{selectedLang.flag}</span>
        <span className="hidden sm:inline">{selectedLang.code.toUpperCase()}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleChangeLanguage(lang. code as 'id' | 'en')}
              className={`w-full text-left px-4 py-2 flex items-center gap-3 transition-colors ${
                currentLang === lang.code
                  ?  'bg-red-50 text-red-600 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <div className="flex-1">
                <p className="font-medium">{lang.name}</p>
                <p className="text-xs text-gray-500">{lang.code.toUpperCase()}</p>
              </div>
              {currentLang === lang.code && (
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1. 414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}