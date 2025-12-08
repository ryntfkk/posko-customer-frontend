// src/components/home/TechnicianSection.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchProviders, FetchProvidersParams } from '@/features/providers/api';
import { Provider } from '@/features/providers/types';
import { useLanguage } from '@/context/LanguageContext'; // [BARU]

interface TechnicianSectionProps {
  userLocation?: {
    lat: number;
    lng: number;
  };
}

// Helper: Menghitung jarak (Haversine Formula) dalam KM
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius bumi dalam KM
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d.toFixed(1); 
}

// Helper: Format harga ringkas
const formatCompactPrice = (price: number) => {
  if (price >= 1000000) {
    return (price / 1000000).toFixed(1).replace(/\.0$/, '') + 'jt';
  }
  if (price >= 1000) {
    return (price / 1000).toFixed(0) + 'rb';
  }
  return price.toString();
};

export default function TechnicianSection({ userLocation }: TechnicianSectionProps) {
  const { t } = useLanguage(); // [BARU]
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProviders = async () => {
      try {
        setIsLoading(true);
        const params: FetchProvidersParams = { limit: 8 };
        
        if (userLocation) {
          params.lat = userLocation.lat;
          params.lng = userLocation.lng;
        }
        
        const res = await fetchProviders(params);
        setProviders(res.data || []);
      } catch (error) {
        console.error('Gagal memuat daftar mitra:', error);
        setProviders([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadProviders();
  }, [userLocation]);

  // Loading State
  if (isLoading) {
    return (
      <section className="py-4 lg:py-8 bg-white border-t border-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3 px-4 lg:px-8">
            <div>
              {/* [UPDATE] t() */}
              <h2 className="text-sm lg:text-lg font-bold text-gray-900">{t('home.nearbyTitle')}</h2>
            </div>
          </div>
          <div className="flex gap-3 px-4 lg:px-8 pb-2 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-32 lg:w-48 shrink-0 flex flex-col gap-2">
                 <div className="aspect-[4/3] bg-gray-100 rounded-xl animate-pulse" />
                 <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
                 <div className="h-2 w-1/2 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Empty State
  if (providers.length === 0) {
    return (
      <section className="py-4 lg:py-8 bg-white border-t border-gray-50">
         <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <h2 className="text-sm lg:text-lg font-bold text-gray-900 mb-3">{t('home.nearbyTitle')}</h2>
            <div className="bg-gray-50 rounded-xl p-4 text-center border border-dashed border-gray-200">
              <p className="text-gray-400 text-xs">{t('home.noNearby')}</p>
            </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-4 lg:py-8 bg-white border-t border-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-3 lg:mb-5 px-4 lg:px-8">
          <div>
            <h2 className="text-sm lg:text-lg font-bold text-gray-900">{t('home.nearbyTitle')}</h2>
            <p className="text-[10px] text-gray-500 hidden lg:block">{t('home.nearbySubtitle')}</p>
          </div>
          <Link href="/search" className="text-[10px] lg:text-xs font-bold text-red-600 hover:bg-red-50 px-2 py-1 rounded-full transition-colors flex items-center gap-1">
            {t('common.viewAll')}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          </Link>
        </div>

        {/* LIST - Snap Scroll */}
        <div className="flex gap-3 lg:gap-4 overflow-x-auto px-4 lg:px-8 pb-4 pt-1 no-scrollbar snap-x">
          {providers.map((prov) => {
             // --- Logic Jarak ---
             let distanceStr = null;
             if (userLocation && prov.userId?.location?.coordinates) {
                 const provLng = prov.userId.location.coordinates[0];
                 const provLat = prov.userId.location.coordinates[1];
                 distanceStr = calculateDistance(userLocation.lat, userLocation.lng, provLat, provLng);
             }

             // --- Helpers Services & Price ---
             const activeServices = prov.services || [];
             
             // 1. Ambil nama services (Max 2 item agar compact)
             const serviceNames = activeServices
                .filter(s => s.isActive && s.serviceId?.name)
                .map(s => s.serviceId.name)
                .slice(0, 2)
                .join(', ');
             
             // 2. Tentukan teks services
             const serviceDisplay = serviceNames || 'Belum mendaftar layanan';

             const getMinPrice = () => {
                 if (activeServices.length === 0) return 0;
                 return Math.min(...activeServices.map((s) => s.price || 0));
             };
             const minPrice = getMinPrice();

             // Helper Lokasi
             const getLocationLabel = () => {
                const addr = prov.userId?.address;
                if (!addr) return 'Lokasi Mitra';
                if (addr.district) return `Kec. ${addr.district}`;
                if (addr.city) return addr.city;
                return 'Lokasi Mitra';
             };

             return (
              <Link
                href={`/provider/${prov._id}`}
                key={prov._id}
                className="snap-start bg-white rounded-xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden shrink-0 flex flex-col w-32 lg:w-48 group hover:shadow-md hover:border-red-100 transition-all duration-300"
              >
                {/* IMAGE AREA */}
                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                  <Image
                    src={prov.userId?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${prov.userId?.fullName || 'default'}`}
                    alt={prov.userId?.fullName || 'Mitra'}
                    fill
                    sizes="(max-width: 768px) 128px, 192px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Rating Badge */}
                  <div className="absolute bottom-1.5 left-1.5 z-20 flex items-center gap-0.5 bg-black/60 backdrop-blur-[2px] px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white border border-white/10">
                    <span className='text-yellow-400 text-[8px]'>★</span>
                    <span>{(prov.rating && prov.rating > 0) ? prov.rating.toFixed(1) : 'Baru'}</span>
                  </div>

                  {/* Online Dot */}
                  {prov.isOnline && (
                    <div className="absolute top-1.5 right-1.5 z-20 w-2 h-2 bg-green-500 rounded-full border border-white shadow-sm animate-pulse"></div>
                  )}
                </div>

                {/* CONTENT AREA */}
                <div className="p-2 flex flex-col flex-1 gap-0.5">
                  <h4 className="font-bold text-xs text-gray-900 truncate leading-tight group-hover:text-red-600 transition-colors">
                    {prov.userId?.fullName || 'Mitra Posko'}
                  </h4>

                  <div className="flex items-center gap-1 mb-0.5">
                    <svg className="w-2.5 h-2.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-[10px] text-gray-500 truncate w-full">
                        {serviceDisplay}
                        {activeServices.length > 2 && <span className="text-[9px] align-top ml-0.5">+</span>}
                    </p>
                  </div>
                  
                  {/* Lokasi & Jarak */}
                  <div className="flex items-center gap-1 text-[9px] text-gray-400 leading-tight">
                    <span className="truncate max-w-[60%]">{getLocationLabel()}</span>
                    {distanceStr && (
                      <>
                        <span className="shrink-0">•</span>
                        <span className="shrink-0 text-gray-500 font-medium">{distanceStr}km</span>
                      </>
                    )}
                  </div>

                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <div className="flex flex-col">
                        {/* [UPDATE] t() */}
                        <span className="text-[8px] text-gray-400 leading-none mb-0.5">{t('common.start')}</span>
                        <span className="text-[10px] lg:text-xs font-bold text-red-600 leading-none">
                            {minPrice > 0 ? formatCompactPrice(minPrice) : t('common.contact')}
                        </span>
                    </div>
                    {/* Action Icon */}
                    <div className="w-5 h-5 rounded-full bg-red-50 text-red-400 group-hover:bg-red-600 group-hover:text-white flex items-center justify-center transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                    </div>
                  </div>
                </div>
              </Link>
             );
          })}
        </div>
      </div>
    </section>
  );
}