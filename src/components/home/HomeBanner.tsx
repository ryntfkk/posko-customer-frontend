// src/components/home/HomeBanner.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { bannerApi } from '@/features/banners/api';
import { Banner } from '@/features/banners/types';

export default function HomeBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const autoSlideInterval = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Data Banner
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await bannerApi.getActiveBanners();
        if (response.data && Array.isArray(response.data)) {
          setBanners(response.data);
        }
      } catch (error) {
        console.error("Gagal memuat banner:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // 2. Logic Auto Slide
  useEffect(() => {
    if (banners.length > 1) {
      startAutoSlide();
    }
    return () => stopAutoSlide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banners.length, currentSlide]);

  const startAutoSlide = () => {
    stopAutoSlide();
    autoSlideInterval.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4000); // Ganti slide setiap 4 detik
  };

  const stopAutoSlide = () => {
    if (autoSlideInterval.current) {
      clearInterval(autoSlideInterval.current);
    }
  };

  const handleManualChange = (index: number) => {
    stopAutoSlide();
    setCurrentSlide(index);
    // Restart timer setelah user klik manual
    setTimeout(startAutoSlide, 5000);
  };

  // Render Loading State (Skeleton)
  if (isLoading) {
    return (
      <section className="px-4 lg:px-8 mt-4 lg:mt-6 max-w-7xl mx-auto">
        <div className="w-full aspect-[2.5/1] lg:aspect-[3.5/1] bg-gray-200 rounded-xl animate-pulse"></div>
      </section>
    );
  }

  // Jika tidak ada banner, jangan tampilkan apa-apa (atau tampilkan default)
  if (banners.length === 0) return null;

  return (
    <section className="px-4 lg:px-8 mt-4 lg:mt-6 max-w-7xl mx-auto">
      <div className="relative w-full aspect-[2.5/1] lg:aspect-[3.5/1] rounded-2xl overflow-hidden shadow-sm group">
        
        {/* Slides Container */}
        {banners.map((banner, index) => (
          <div
            key={banner._id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Wrapper Image agar bisa di-klik jika ada link */}
            {banner.linkUrl ? (
              <Link href={banner.linkUrl} className="block w-full h-full relative">
                 <Image
                  src={banner.imageUrl}
                  alt={banner.title || 'Promo Banner'}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
              </Link>
            ) : (
              <div className="w-full h-full relative">
                <Image
                  src={banner.imageUrl}
                  alt={banner.title || 'Promo Banner'}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
              </div>
            )}
            
            {/* Optional Overlay Text (Jika ada title) */}
            {(banner.title || banner.description) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4 lg:p-8">
                    {banner.title && <h3 className="text-white font-bold text-lg lg:text-2xl">{banner.title}</h3>}
                    {banner.description && <p className="text-white/90 text-xs lg:text-sm mt-1 max-w-lg">{banner.description}</p>}
                </div>
            )}
          </div>
        ))}

        {/* Indicators (Dots) */}
        {banners.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleManualChange(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}