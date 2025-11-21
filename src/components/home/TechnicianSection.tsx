// src/components/home/TechnicianSection.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Provider } from '@/features/providers/types';
import { User } from '@/features/auth/types';

// Helper hitung jarak sederhana
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d < 1 ? `${(d * 1000).toFixed(0)} m` : `${d.toFixed(1)} km`;
}

interface TechnicianSectionProps {
  providers: Provider[];
  isLoading: boolean;
  userLocation?: User['location'];
}

export default function TechnicianSection({ providers, isLoading, userLocation }: TechnicianSectionProps) {
  
  const getDistance = (providerLoc?: { coordinates: number[] }) => {
    if (!userLocation?.coordinates || !providerLoc?.coordinates) return '...';
    const [uLng, uLat] = userLocation.coordinates;
    const [pLng, pLat] = providerLoc.coordinates;
    return calculateDistance(uLat, uLng, pLat, pLng);
  };

  const getMinPrice = (provider: Provider) => {
    if (!provider.services.length) return 'Hubungi CS';
    const min = Math.min(...provider.services.map(s => s.price));
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(min);
  };

  return (
    <section className="py-6 lg:py-16 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        <div className="flex justify-between items-end mb-5 lg:mb-10">
          <div>
            <h2 className="text-lg lg:text-3xl font-bold text-gray-900 leading-tight">
              Rekomendasi <br className="lg:hidden" /> di Sekitarmu
            </h2>
            <p className="text-xs lg:text-base text-gray-500 mt-1">
              Mitra teknisi terverifikasi di area Anda.
            </p>
          </div>
          <Link href="/services/ac" className="text-xs lg:text-base font-bold text-red-600 hover:underline decoration-2 underline-offset-4 shrink-0">
            Lihat Semua <span className="hidden lg:inline">Mitra →</span>
          </Link>
        </div>

        {/* Loading State - Skeleton Grid */}
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 lg:h-80 bg-gray-100 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && providers.length === 0 && (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
            <p className="text-gray-500 text-sm">Belum ada mitra yang ditemukan di sekitar lokasi Anda.</p>
          </div>
        )}

        {/* Data Real - Grid 2 Kolom di Mobile */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-8">
          {!isLoading && providers.map((prov) => (
            <Link 
              href={`/provider/${prov._id}`} 
              key={prov._id} 
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
            >
              {/* Image Cover (Aspect Ratio 4:3 untuk mobile agar tidak terlalu tinggi) */}
              <div className="aspect-[4/3] w-full bg-gray-100 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 z-10"></div>
                <Image 
                  src={prov.userId.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${prov.userId.fullName}`} 
                  alt={prov.userId.fullName} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                
                {/* Badge Rating (Pojok Kanan Atas) */}
                <div className="absolute top-2 right-2 z-20">
                    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-lg shadow-sm border border-white/50">
                      <span className="text-[10px] text-yellow-500">★</span>
                      <span className="text-[10px] font-bold text-gray-900">{prov.rating.toFixed(1)}</span>
                    </div>
                </div>

                {/* Badge Jarak (Pojok Kiri Bawah Image) */}
                <div className="absolute bottom-2 left-2 z-20">
                  <div className="flex items-center gap-1 text-[10px] font-medium text-white bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    {getDistance(prov.userId.location)}
                  </div>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-3 lg:p-5 flex flex-col gap-1 flex-1">
                {/* Nama Mitra */}
                <h3 className="text-xs lg:text-lg font-bold text-gray-900 line-clamp-2 leading-tight">
                  {prov.userId.fullName}
                </h3>
                
                {/* Jenis Layanan Utama */}
                <p className="text-[10px] lg:text-sm text-gray-500 line-clamp-1 mb-1">
                    {prov.services[0]?.serviceId?.name || 'Teknisi Umum'}
                </p>

                {/* Harga & Tombol */}
                <div className="mt-auto pt-2 border-t border-gray-50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider hidden lg:block">Mulai Dari</span>
                      <span className="text-red-600 font-bold text-xs lg:text-lg">{getMinPrice(prov)}</span>
                    </div>
                    
                    <span className="hidden lg:inline-block bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-600 transition-colors text-center">
                      Pesan
                    </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}