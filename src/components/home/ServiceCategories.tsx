// src/components/home/ServiceCategories.tsx
'use client';

import { useState, memo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Category {
  name: string;
  slug: string;
  iconUrl?: string;
}

interface ServiceCategoriesProps {
  isLoading: boolean;
  categories: Category[];
}

function ServiceCategories({ isLoading, categories }: ServiceCategoriesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryLink = useCallback((category: Category) => {
    const params = new URLSearchParams({ category: category.name, categoryId: category.slug });
    return `/services/${category.slug}?${params.toString()}`;
  }, []);

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
        <>
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
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/icons/logo-posko.png';
                    }}
                  />
                </div>
                <span className="text-[10px] lg:text-sm font-bold text-gray-700 text-center line-clamp-2">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>

          {/* MORE / LESS BUTTON */}
          {(shouldShowMoreBtn || shouldShowLessBtn) && (
            <div className="flex justify-center mt-6 lg:mt-8">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-6 py-2 lg:px-8 lg:py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors text-sm lg:text-base"
              >
                {shouldShowMoreBtn ? 'Lihat Kategori Lainnya' : 'Tampilkan Lebih Sedikit'}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default memo(ServiceCategories);