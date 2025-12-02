// src/components/home/TechnicianSection.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchProviders, FetchProvidersParams } from '@/features/providers/api';
import { Provider } from '@/features/providers/types';

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
  return d.toFixed(1); // Mengembalikan string 1 desimal
}

export default function TechnicianSection({ userLocation }: TechnicianSectionProps) {
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
      <section className="py-2 lg:py-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6 px-4 lg:px-80">
            <div>
              <h2 className="text-lg lg:text-2xl font-bold text-gray-900">Mitra Terdekat</h2>
              <p className="text-xs lg:text-base text-gray-500">Teknisi profesional di sekitar Anda</p>
            </div>
          </div>
          <div className="flex gap-4 lg:gap-6 overflow-x-auto px-4 lg:px-8 pb-4 no-scrollbar">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-48 lg:w-64 shrink-0 bg-gray-100 rounded-2xl h-64 lg:h-80 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Empty State
  if (providers.length === 0) {
    return (
      <section className="py-2 lg:py-12 bg-white">
         <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg lg:text-2xl font-bold text-gray-900">Mitra Terdekat</h2>
                <p className="text-xs lg:text-base text-gray-500">Teknisi profesional di sekitar Anda</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed border-gray-200">
              <p className="text-gray-500 text-sm">Belum ada mitra tersedia di sekitar Anda.</p>
            </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-2 lg:py-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4 lg:mb-8 px-4 lg:px-8">
          <div>
            <h2 className="text-lg lg:text-2xl font-bold text-gray-900">Mitra Terdekat</h2>
            <p className="text-xs lg:text-base text-gray-500">Teknisi profesional di sekitar Anda</p>
          </div>
          <Link href="/search" className="text-xs lg:text-sm font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1">
            Lihat Semua
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          </Link>
        </div>

        <div className="flex gap-4 lg:gap-6 overflow-x-auto px-4 lg:px-8 pb-6 pt-2 no-scrollbar">
          {providers.map((prov) => {
             // --- Logic Perhitungan Jarak ---
             let distanceStr = null;
             if (userLocation && prov.userId?.location?.coordinates) {
                 const provLng = prov.userId.location.coordinates[0];
                 const provLat = prov.userId.location.coordinates[1];
                 distanceStr = calculateDistance(userLocation.lat, userLocation.lng, provLat, provLng);
             }

             // --- Logic Tampilan Data (Helpers) ---
             
             // 1. Lokasi Label
             const getLocationLabel = () => {
                const addr = prov.userId?.address;
                if (!addr) return 'Lokasi Mitra';
                if (addr.district) return `Kec. ${addr.district}`; // Prioritas Kecamatan sesuai style baru
                if (addr.city) return addr.city;
                return 'Lokasi Mitra';
             };

             // 2. Services (Ambil layanan aktif atau semua layanan jika properti isActive belum ada)
             // Asumsi: jika ada flag isActive gunakan, jika tidak, anggap semua aktif
             const activeServices = prov.services || [];
             
             // 3. Harga Termurah
             const getMinPrice = () => {
                 if (activeServices.length === 0) return 0;
                 return Math.min(...activeServices.map((s) => s.price || 0));
             };
             const minPrice = getMinPrice();

             return (
              <Link
                href={`/provider/${prov._id}`}
                key={prov._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col w-48 lg:w-64 shrink-0 h-auto"
              >
                {/* --- Image Section --- */}
                <div className="relative h-28 lg:h-36 bg-gray-100 overflow-hidden shrink-0">
                  <Image
                    src={prov.userId?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${prov.userId?.fullName || 'default'}`}
                    alt={prov.userId?.fullName || 'Mitra'}
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />

                  {/* Rating Badge (Style Baru: Dark Transparent) */}
                  <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] lg:text-[10px] font-bold text-white border border-white/10">
                    <span>⭐</span>
                    <span>{(prov.rating && prov.rating > 0) ? prov.rating.toFixed(1) : 'Baru'}</span>
                  </div>

                  {/* Online Badge (DIPERTAHANKAN SESUAI REQUEST) */}
                  {prov.isOnline && (
                    <div className="absolute top-2 right-2 z-20">
                      <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
                    </div>
                  )}

                  {/* Distance Badge (Style Baru: Ditampilkan jika ada userLocation) */}
                  {distanceStr && (
                    <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] lg:text-[10px] font-medium text-gray-700 border border-white/20 shadow-sm">
                        <span className="text-red-500">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                          </svg>
                        </span>
                        <span>{distanceStr} km</span>
                    </div>
                  )}
                </div>

                {/* --- Content Section --- */}
                <div className="p-3 lg:p-4 flex flex-col flex-1">
                  {/* Nama & Lokasi */}
                  <h4 className="font-bold text-sm lg:text-base text-gray-900 truncate group-hover:text-red-600 transition-colors">
                    {prov.userId?.fullName || 'Mitra Posko'}
                  </h4>
                  <p className="text-[10px] lg:text-xs text-gray-500 truncate mt-0.5">
                    {getLocationLabel()}
                  </p>

                  {/* Tags Layanan */}
                  <div className="flex flex-wrap gap-1 my-2">
                    {activeServices.slice(0, 2).map((svc, idx) => (
                      <span key={idx} className="text-[9px] lg:text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200 line-clamp-1 truncate max-w-[80px]">
                        {svc.serviceId?.name || 'Layanan'}
                      </span>
                    ))}
                    {activeServices.length > 2 && (
                      <span className="text-[9px] lg:text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded border border-gray-100">
                        +{activeServices.length - 2}
                      </span>
                    )}
                  </div>

                  {/* Harga & Button */}
                  <div className="mt-auto pt-2 border-t border-gray-100 flex justify-between items-end">
                    <div>
                        <p className="text-[9px] lg:text-[10px] text-gray-400">Mulai dari</p>
                        <p className="text-xs lg:text-sm font-bold text-red-600">
                            {minPrice > 0
                                ? new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0,
                                }).format(minPrice)
                                : 'Hubungi CS'}
                        </p>
                    </div>
                    {/* Tombol Pesan (Visual Saja karena Card adalah Link) */}
                    <button className="bg-red-50 text-red-600 p-1.5 lg:p-2 rounded-lg text-[10px] lg:text-xs font-bold hover:bg-red-100 transition-colors">
                        Pesan
                    </button>
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