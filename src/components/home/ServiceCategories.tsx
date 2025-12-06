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
    // PADDING: mt-2 -> mt-4, lg:py-16 -> lg:py-12. Lebih ringkas.
    <section className="px-4 mt-4 lg:max-w-7xl lg:mx-auto lg:px-8 lg:py-12">
      {/* HEADING: text-base -> text-sm, lg:text-2xl -> lg:text-xl. Margin bawah mb-4 -> mb-3 */}
      <div className="flex justify-between items-end mb-3 lg:mb-6">
        <h3 className="text-sm lg:text-xl font-bold text-gray-900 tracking-tight">
          <span className="lg:hidden">Layanan</span>
          <span className="hidden lg:inline">Jelajahi Kategori</span>
        </h3>
      </div>

      {isLoading ? (
        // GAP: gap-4 -> gap-3. h-20 -> h-24 (menjaga aspek rasio di mobile)
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-3 lg:gap-5 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-24 lg:h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        // Empty State Padding: p-6 -> p-4. Rounded lebih kecil.
        <div className="p-4 lg:p-6 text-center bg-white lg:bg-gray-50 rounded-xl lg:rounded-2xl border border-gray-100 lg:border-gray-200 shadow-sm lg:shadow-none">
          <p className="text-xs lg:text-sm text-gray-400 lg:text-gray-500">Belum ada kategori layanan tersedia.</p>
        </div>
      ) : (
        // GRID: gap-y-5 -> gap-y-4.
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-y-4 gap-x-2 lg:gap-6">
          {/* RENDER KATEGORI */}
          {visibleCategories.map((cat) => (
            <Link
              key={cat.name}
              href={getCategoryLink(cat)}
              className="flex flex-col items-center gap-1.5 lg:gap-3 active:scale-95 transition-transform cursor-pointer group lg:p-4 lg:bg-white lg:border lg:border-gray-100 lg:rounded-xl lg:hover:border-red-200 lg:hover:shadow-lg lg:duration-300"
            >
              {/* ICON CONTAINER: w-[3.25rem] h-[3.25rem] -> w-12 h-12. Rounded-xl. p-3 -> p-2.5 */}
              <div className="relative w-12 h-12 lg:w-14 lg:h-14 bg-white lg:bg-gray-50 rounded-xl border border-gray-100 lg:border-none shadow-sm flex items-center justify-center overflow-hidden p-2.5 lg:group-hover:scale-110 lg:group-hover:bg-red-50 lg:transition-all">
                <Image
                  src={cat.iconUrl || '/icons/logo-posko.png'}
                  alt={cat.name}
                  width={32} // Mengganti width/height dari 40 ke 32
                  height={32}
                  className="object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/icons/logo-posko.png' }}
                />
              </div>
              {/* TEXT: text-[10px] tetap, h-7 -> h-6, leading-tight -> leading-3 (Compact) */}
              <span className="text-[10px] lg:text-xs lg:font-semibold font-medium text-gray-600 lg:text-gray-700 text-center line-clamp-2 leading-3 h-6 flex items-center justify-center lg:group-hover:text-red-600 lg:transition-colors px-1">
                {cat.name}
              </span>
            </Link>
          ))}

          {/* TOMBOL LAINNYA */}
          {shouldShowMoreBtn && (
            <button
              onClick={() => setIsExpanded(true)}
              className="flex flex-col items-center gap-1.5 lg:gap-3 active:scale-95 transition-transform cursor-pointer group lg:p-4 lg:bg-white lg:border lg:border-gray-100 lg:rounded-xl lg:hover:border-red-200 lg:hover:shadow-lg lg:duration-300"
            >
              <div className="relative w-12 h-12 lg:w-14 lg:h-14 bg-gray-50 lg:bg-gray-100 rounded-xl border border-gray-200 lg:border-none shadow-sm flex items-center justify-center overflow-hidden p-2.5 lg:group-hover:scale-110 lg:group-hover:bg-red-50 lg:transition-all">
                {/* Icon Grid / Dots untuk "More" */}
                <svg className="w-5 h-5 text-gray-500 lg:group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </div>
              <span className="text-[10px] lg:text-xs lg:font-semibold font-bold text-gray-600 lg:text-gray-700 text-center line-clamp-2 leading-3 h-6 flex items-center justify-center lg:group-hover:text-red-600 lg:transition-colors">
                Lainnya
              </span>
            </button>
          )}

          {/* TOMBOL TUTUP */}
          {shouldShowLessBtn && (
            <button
              onClick={() => setIsExpanded(false)}
              className="flex flex-col items-center gap-1.5 lg:gap-3 active:scale-95 transition-transform cursor-pointer group lg:p-4 lg:bg-white lg:border lg:border-gray-100 lg:rounded-xl lg:hover:border-red-200 lg:hover:shadow-lg lg:duration-300"
            >
              <div className="relative w-12 h-12 lg:w-14 lg:h-14 bg-red-50 lg:bg-red-50 rounded-xl border border-red-100 lg:border-none shadow-sm flex items-center justify-center overflow-hidden p-2.5 lg:group-hover:scale-110 lg:group-hover:bg-red-100 lg:transition-all">
                {/* Icon Chevron Up untuk "Close" */}
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
              <span className="text-[10px] lg:text-xs lg:font-semibold font-bold text-red-600 lg:text-red-700 text-center line-clamp-2 leading-3 h-6 flex items-center justify-center lg:group-hover:text-red-800 lg:transition-colors">
                Tutup
              </span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}