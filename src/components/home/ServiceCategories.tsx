// src/components/home/ServiceCategories.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext'; // [BARU] Import

interface CategoryData {
  name: string;
  slug: string;
  iconUrl: string;
}

interface ServiceCategoriesProps {
  categories: CategoryData[];
  isLoading: boolean;
}

export default function ServiceCategories({ categories, isLoading }: ServiceCategoriesProps) {
  const { t } = useLanguage(); // [BARU] Hook
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper Link Generation
  const getCategoryLink = (category: CategoryData) => {
    const normalizedSlug = category.slug.toLowerCase();
    const normalizedName = category.name.toLowerCase();
    const isACCategory = /\bac\b/.test(normalizedName) || normalizedSlug === 'ac' || normalizedSlug.startsWith('ac-');

    if (isACCategory) {
      const params = new URLSearchParams({ category: category.name, categoryId: category.slug });
      return `/services/${category.slug}?${params.toString()}`;
    }
    return `/services/${category.slug}`;
  };

  // LOGIKA PEMBATASAN ITEM (High Density: Max 8 item sebelum expand)
  const LIMIT = 7; 
  const shouldShowMoreBtn = categories.length > 8 && !isExpanded;
  const shouldShowLessBtn = isExpanded;

  const visibleCategories = shouldShowMoreBtn 
    ? categories.slice(0, LIMIT) 
    : categories;

  return (
    <section className="px-4 mt-4 lg:max-w-7xl lg:mx-auto lg:px-8">
      <div className="flex justify-between items-baseline mb-3">
        {/* [UPDATE] Menggunakan t() */}
        <h3 className="text-sm font-bold text-gray-900 tracking-tight lg:text-lg">
          {t('home.categoriesTitle')}
        </h3>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-x-2 gap-y-4 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
               <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-100 rounded-xl"></div>
               <div className="w-10 h-2 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="p-4 text-center bg-white rounded-xl border border-gray-100 shadow-sm border-dashed">
          {/* [UPDATE] Menggunakan t() */}
          <p className="text-xs text-gray-400">{t('home.noCategories')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-x-2 gap-y-3">
          {visibleCategories.map((cat) => (
            <Link
              key={cat.name}
              href={getCategoryLink(cat)}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform group"
            >
              <div className="relative w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex items-center justify-center p-2 group-hover:border-red-200 group-hover:shadow-md transition-all">
                <Image
                  src={cat.iconUrl || '/icons/logo-posko.png'}
                  alt={cat.name}
                  width={32} 
                  height={32}
                  className="object-contain w-5 h-5 lg:w-6 lg:h-6 opacity-80 group-hover:opacity-100 transition-opacity"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/icons/logo-posko.png' }}
                />
              </div>
              <span className="text-[10px] lg:text-xs font-medium text-gray-600 lg:text-gray-700 text-center leading-3 h-6 flex items-start justify-center line-clamp-2 px-0.5 group-hover:text-red-600 transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}

          {shouldShowMoreBtn && (
            <button
              onClick={() => setIsExpanded(true)}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform group"
            >
              <div className="relative w-10 h-10 lg:w-12 lg:h-12 bg-gray-50 rounded-xl border border-gray-200 border-dashed flex items-center justify-center p-2 group-hover:bg-red-50 group-hover:border-red-200 group-hover:border-solid transition-all">
                <svg className="w-4 h-4 text-gray-400 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </div>
              {/* [UPDATE] Menggunakan t() */}
              <span className="text-[10px] lg:text-xs font-bold text-gray-500 text-center leading-3 h-6 flex items-start justify-center group-hover:text-red-600 transition-colors">
                {t('common.others')}
              </span>
            </button>
          )}

          {shouldShowLessBtn && (
            <button
              onClick={() => setIsExpanded(false)}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform group"
            >
              <div className="relative w-10 h-10 lg:w-12 lg:h-12 bg-red-50 rounded-xl border border-red-100 flex items-center justify-center p-2 group-hover:bg-red-100 transition-all">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
              {/* [UPDATE] Menggunakan t() */}
              <span className="text-[10px] lg:text-xs font-bold text-red-600 text-center leading-3 h-6 flex items-start justify-center group-hover:text-red-800 transition-colors">
                {t('common.close')}
              </span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}