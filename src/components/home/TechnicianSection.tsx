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

  // Loading State - Disesuaikan agar lebih ringkas
  if (isLoading) {
    return (
      <section className="py-6 lg:py-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4 px-4 lg:px-8">
            <div>
              <h2 className="text-sm lg:text-xl font-bold text-gray-900">Mitra Terdekat</h2>
              <p className="text-[10px] lg:text-sm text-gray-500">Teknisi profesional di sekitar Anda</p>
            </div>
          </div>
          {/* Card Loading lebih kecil & compact */}
          <div className="flex gap-3 lg:gap-5 overflow-x-auto px-4 lg:px-8 pb-4 no-scrollbar">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-36 lg:w-56 shrink-0 bg-gray-100 rounded-xl h-48 lg:h-64 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Empty State - Disesuaikan agar lebih ringkas
  if (providers.length === 0) {
    return (
      <section className="py-6 lg:py-12 bg-white">
         <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm lg:text-xl font-bold text-gray-900">Mitra Terdekat</h2>
                <p className="text-[10px] lg:text-sm text-gray-500">Teknisi profesional di sekitar Anda</p>
              </div>
            </div>
            {/* Padding dikurangi */}
            <div className="bg-gray-50 rounded-xl p-6 text-center border border-dashed border-gray-200">
              <p className="text-gray-500 text-xs">Belum ada mitra tersedia di sekitar Anda.</p>
            </div>
        </div>
      </section>
    );
  }

  return (
    // PADDING: py-2 -> py-6
    <section className="py-6 lg:py-12 bg-white border-t border-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* HEADER: text-lg -> text-sm, lg:text-2xl -> lg:text-xl. mb-4 -> mb-3 */}
        <div className="flex items-center justify-between mb-3 lg:mb-6 px-4 lg:px-8">
          <div>
            <h2 className="text-sm lg:text-xl font-bold text-gray-900">Mitra Terdekat</h2>
            <p className="text-[10px] lg:text-sm text-gray-500">Teknisi profesional di sekitar Anda</p>
          </div>
          {/* LINK LIHAT SEMUA: text-xs -> text-[10px]. Icon w-4 -> w-3 */}
          <Link href="/search" className="text-[10px] lg:text-sm font-semibold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1">
            Lihat Semua
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          </Link>
        </div>

        {/* LIST: gap-4 -> gap-3. pb-6 -> pb-4 */}
        <div className="flex gap-3 lg:gap-5 overflow-x-auto px-4 lg:px-8 pb-4 pt-1 no-scrollbar">
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
                // CARD WIDTH: w-48 -> w-36. lg:w-64 -> lg:w-56. Rounded-2xl -> rounded-xl
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col w-36 lg:w-56 shrink-0 h-auto"
              >
                {/* --- Image Section --- h-28 -> h-24. lg:h-36 -> lg:h-32 */}
                <div className="relative h-24 lg:h-32 bg-gray-100 overflow-hidden shrink-0">
                  <Image
                    src={prov.userId?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${prov.userId?.fullName || 'default'}`}
                    alt={prov.userId?.fullName || 'Mitra'}
                    fill
                    sizes="(max-width: 768px) 40vw, 20vw" // Sizes disesuaikan dengan lebar kartu baru
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />

                  {/* Rating Badge: Lebih kecil dan ringkas */}
                  <div className="absolute bottom-1.5 left-1.5 z-20 flex items-center gap-0.5 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-bold text-white border border-white/10">
                    <span className='text-yellow-400'>★</span>
                    <span>{(prov.rating && prov.rating > 0) ? prov.rating.toFixed(1) : 'Baru'}</span>
                  </div>

                  {/* Online Badge - Tetap sama (kecil) */}
                  {prov.isOnline && (
                    <div className="absolute top-2 right-2 z-20">
                      <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
                    </div>
                  )}

                  {/* Distance Badge: Lebih kecil dan ringkas. text-[9px] */}
                  {distanceStr && (
                    <div className="absolute bottom-1.5 right-1.5 z-20 flex items-center gap-0.5 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-semibold text-gray-700 border border-white/20 shadow-sm">
                        <span className="text-red-500">
                          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                          </svg>
                        </span>
                        <span>{distanceStr} km</span>
                    </div>
                  )}
                </div>

                {/* --- Content Section --- p-3 -> p-2.5 */}
                <div className="p-2.5 flex flex-col flex-1">
                  {/* Nama & Lokasi */}
                  <h4 className="font-bold text-xs lg:text-base text-gray-900 truncate group-hover:text-red-600 transition-colors leading-tight">
                    {prov.userId?.fullName || 'Mitra Posko'}
                  </h4>
                  {/* Lokasi: text-[10px] untuk kepadatan */}
                  <p className="text-[10px] lg:text-xs text-gray-400 truncate mt-0.5">
                    {getLocationLabel()}
                  </p>

                  {/* Tags Layanan: Sembunyikan di mobile kecil */}
                  <div className="hidden lg:flex flex-wrap gap-1 my-2">
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
                  
                  {/* Spacer untuk mobile */}
                  <div className="lg:hidden h-2"></div>


                  {/* Harga & Button */}
                  <div className="mt-auto pt-2 border-t border-gray-100 flex justify-between items-end">
                    <div>
                        <p className="text-[9px] text-gray-400 leading-none">Mulai dari</p>
                        <p className="text-xs lg:text-sm font-bold text-red-600 leading-none">
                            {minPrice > 0
                                ? new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0,
                                }).format(minPrice)
                                : 'Hubungi CS'}
                        </p>
                    </div>
                    {/* Tombol Pesan: Lebih ringkas px-2 py-1 */}
                    <button className="bg-red-50 text-red-600 px-2 py-1 rounded-lg text-[10px] lg:text-xs font-bold hover:bg-red-100 transition-colors shrink-0">
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