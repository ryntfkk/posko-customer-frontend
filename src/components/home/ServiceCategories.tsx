// src/components/home/ServiceCategories.tsx
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
  // State untuk mengatur apakah kategori ditampilkan semua atau dibatasi
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

  // LOGIKA PEMBATASAN ITEM
  // Mobile: 4 kolom. Max 2 baris = 8 item.
  // Jadi jika belum expanded, kita ambil 7 item pertama, item ke-8 jadi tombol "Lainnya".
  const LIMIT = 7; 
  const shouldShowMoreBtn = categories.length > 8 && !isExpanded;
  const shouldShowLessBtn = isExpanded;

  const visibleCategories = shouldShowMoreBtn 
    ? categories.slice(0, LIMIT) 
    : categories;

  return (
    <section className="px-4 mt-6 lg:max-w-7xl lg:mx-auto lg:px-8 lg:py-16">
      <div className="flex justify-between items-end mb-4 lg:mb-8">
        <h3 className="text-base lg:text-2xl font-bold text-gray-900">
          <span className="lg:hidden">Layanan</span>
          <span className="hidden lg:inline">Jelajahi Kategori</span>
        </h3>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-4 lg:gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-20 lg:h-32 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="p-6 lg:p-10 text-center bg-white lg:bg-gray-50 rounded-2xl lg:rounded-3xl border border-gray-100 lg:border-gray-200 shadow-sm lg:shadow-none">
          <p className="text-xs lg:text-lg text-gray-400 lg:text-gray-500">Belum ada kategori layanan tersedia.</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-y-5 gap-x-2 lg:gap-6">
          {/* RENDER KATEGORI */}
          {visibleCategories.map((cat) => (
            <Link
              key={cat.name}
              href={getCategoryLink(cat)}
              className="flex flex-col items-center gap-2 lg:gap-4 active:scale-95 transition-transform cursor-pointer group lg:p-6 lg:bg-white lg:border lg:border-gray-100 lg:rounded-2xl lg:hover:border-red-200 lg:hover:shadow-xl lg:hover:shadow-red-50/50 lg:duration-300"
            >
              <div className="relative w-[3.25rem] h-[3.25rem] lg:w-16 lg:h-16 bg-white lg:bg-gray-50 rounded-2xl border border-gray-100 lg:border-none shadow-sm lg:shadow-none flex items-center justify-center overflow-hidden p-3 lg:group-hover:scale-110 lg:group-hover:bg-red-50 lg:transition-all">
                <Image
                  src={cat.iconUrl || '/icons/logo-posko.png'}
                  alt={cat.name}
                  width={40}
                  height={40}
                  className="object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/icons/logo-posko.png' }}
                />
              </div>
              <span className="text-[10px] lg:text-sm lg:font-semibold font-medium text-gray-600 lg:text-gray-700 text-center line-clamp-2 leading-tight h-7 lg:h-10 flex items-center justify-center lg:group-hover:text-red-600 lg:transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}

          {/* TOMBOL LAINNYA (Muncul di posisi ke-8 jika item > 8 dan belum expanded) */}
          {shouldShowMoreBtn && (
            <button
              onClick={() => setIsExpanded(true)}
              className="flex flex-col items-center gap-2 lg:gap-4 active:scale-95 transition-transform cursor-pointer group lg:p-6 lg:bg-white lg:border lg:border-gray-100 lg:rounded-2xl lg:hover:border-red-200 lg:hover:shadow-xl lg:hover:shadow-red-50/50 lg:duration-300"
            >
              <div className="relative w-[3.25rem] h-[3.25rem] lg:w-16 lg:h-16 bg-gray-50 lg:bg-gray-100 rounded-2xl border border-gray-200 lg:border-none shadow-sm lg:shadow-none flex items-center justify-center overflow-hidden p-3 lg:group-hover:scale-110 lg:group-hover:bg-red-50 lg:transition-all">
                {/* Icon Grid / Dots untuk "More" */}
                <svg className="w-6 h-6 text-gray-500 lg:group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </div>
              <span className="text-[10px] lg:text-sm lg:font-semibold font-bold text-gray-600 lg:text-gray-700 text-center line-clamp-2 leading-tight h-7 lg:h-10 flex items-center justify-center lg:group-hover:text-red-600 lg:transition-colors">
                Lainnya
              </span>
            </button>
          )}

          {/* TOMBOL TUTUP (Opsional: Muncul di akhir list jika sudah expanded agar user bisa collapse lagi) */}
          {shouldShowLessBtn && (
            <button
              onClick={() => setIsExpanded(false)}
              className="flex flex-col items-center gap-2 lg:gap-4 active:scale-95 transition-transform cursor-pointer group lg:p-6 lg:bg-white lg:border lg:border-gray-100 lg:rounded-2xl lg:hover:border-red-200 lg:hover:shadow-xl lg:hover:shadow-red-50/50 lg:duration-300"
            >
              <div className="relative w-[3.25rem] h-[3.25rem] lg:w-16 lg:h-16 bg-red-50 lg:bg-red-50 rounded-2xl border border-red-100 lg:border-none shadow-sm lg:shadow-none flex items-center justify-center overflow-hidden p-3 lg:group-hover:scale-110 lg:group-hover:bg-red-100 lg:transition-all">
                {/* Icon Chevron Up untuk "Close" */}
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
              <span className="text-[10px] lg:text-sm lg:font-semibold font-bold text-red-600 lg:text-red-700 text-center line-clamp-2 leading-tight h-7 lg:h-10 flex items-center justify-center lg:group-hover:text-red-800 lg:transition-colors">
                Tutup
              </span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}