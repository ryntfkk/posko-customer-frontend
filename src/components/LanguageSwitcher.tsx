// src/components/LanguageSwitcher.tsx
'use client';

import { useLanguage } from '@/context/LanguageContext';

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    const newLang = language === 'id' ? 'en' : 'id';
    setLanguage(newLang);
    // Tidak perlu window.location.reload() lagi
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-300 group ${className}`}
      title={language === 'id' ? 'Ganti Bahasa' : 'Change Language'}
    >
      <span className="text-lg leading-none drop-shadow-sm">
        {language === 'id' ? '🇮🇩' : '🇺🇸'}
      </span>
      <span className="text-xs font-bold text-gray-600 group-hover:text-red-600 transition-colors">
        {language === 'id' ? 'ID' : 'EN'}
      </span>
    </button>
  );
}