'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

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
  // State
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

  // LOGIKA PEMBATASAN ITEM (High Density: Tetap 8 item max sebelum expand)
  const LIMIT = 7; 
  const shouldShowMoreBtn = categories.length > 8 && !isExpanded;
  const shouldShowLessBtn = isExpanded;

  const visibleCategories = shouldShowMoreBtn 
    ? categories.slice(0, LIMIT) 
    : categories;

  return (
    // REFINED: Padding vertikal lebih rapat (py-6)
    <section className="px-4 mt-2 lg:max-w-7xl lg:mx-auto lg:px-8 lg:py-8">
      <div className="flex justify-between items-baseline mb-3">
        <h3 className="text-sm font-bold text-gray-900 tracking-tight lg:text-lg">
          <span className="lg:hidden">Layanan</span>
          <span className="hidden lg:inline">Jelajahi Kategori</span>
        </h3>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-x-2 gap-y-4 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
               <div className="w-11 h-11 lg:w-14 lg:h-14 bg-gray-200 rounded-2xl"></div>
               <div className="w-12 h-2 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="p-4 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400">Tidak ada layanan.</p>
        </div>
      ) : (
        // REFINED: Grid lebih rapat (gap-x-2 gap-y-4)
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-x-2 gap-y-4">
          {visibleCategories.map((cat) => (
            <Link
              key={cat.name}
              href={getCategoryLink(cat)}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform group"
            >
              {/* REFINED: Container Icon diperkecil (w-11 h-11) dengan rounded-2xl (Squircle) */}
              <div className="relative w-11 h-11 lg:w-14 lg:h-14 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center p-2.5 lg:group-hover:shadow-md lg:group-hover:border-red-100 transition-all">
                <Image
                  src={cat.iconUrl || '/icons/logo-posko.png'}
                  alt={cat.name}
                  width={24} 
                  height={24}
                  className="object-contain w-6 h-6 lg:w-8 lg:h-8"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/icons/logo-posko.png' }}
                />
              </div>
              {/* REFINED: Text size [10px] dengan leading-3 sangat ketat */}
              <span className="text-[10px] lg:text-xs font-medium text-gray-600 lg:text-gray-700 text-center leading-3 h-6 flex items-center justify-center line-clamp-2 px-0.5 lg:group-hover:text-red-600 transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}

          {/* TOMBOL LAINNYA - Compact Style */}
          {shouldShowMoreBtn && (
            <button
              onClick={() => setIsExpanded(true)}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform group"
            >
              <div className="relative w-11 h-11 lg:w-14 lg:h-14 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center p-2.5 lg:group-hover:bg-red-50 lg:group-hover:border-red-100 transition-all">
                <svg className="w-5 h-5 text-gray-500 lg:group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </div>
              <span className="text-[10px] lg:text-xs font-bold text-gray-600 lg:text-gray-700 text-center leading-3 h-6 flex items-center justify-center lg:group-hover:text-red-600 transition-colors">
                Lainnya
              </span>
            </button>
          )}

          {/* TOMBOL TUTUP - Compact Style */}
          {shouldShowLessBtn && (
            <button
              onClick={() => setIsExpanded(false)}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform group"
            >
              <div className="relative w-11 h-11 lg:w-14 lg:h-14 bg-red-50 rounded-2xl border border-red-100 shadow-sm flex items-center justify-center p-2.5 lg:group-hover:bg-red-100 transition-all">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
              <span className="text-[10px] lg:text-xs font-bold text-red-600 text-center leading-3 h-6 flex items-center justify-center lg:group-hover:text-red-800 transition-colors">
                Tutup
              </span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}