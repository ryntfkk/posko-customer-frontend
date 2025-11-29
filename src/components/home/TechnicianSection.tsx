// src/components/home/TechnicianSection.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
// [UPDATE] Import FetchProvidersParams
import { fetchProviders, FetchProvidersParams } from '@/features/providers/api';
import { Provider } from '@/features/providers/types';

interface TechnicianSectionProps {
  userLocation?: {
    lat: number;
    lng: number;
  };
}

export default function TechnicianSection({ userLocation }: TechnicianSectionProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProviders = async () => {
      try {
        setIsLoading(true);
        // [UPDATE] Ganti 'any' dengan tipe yang eksplisit
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

  if (isLoading) {
    return (
      <section className="py-6">
        <div className="flex items-center justify-between mb-4 px-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Mitra Terdekat</h2>
            <p className="text-xs text-gray-500">Teknisi profesional di sekitar Anda</p>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-48 shrink-0 bg-gray-100 rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (providers.length === 0) {
    return (
      <section className="py-6">
        <div className="flex items-center justify-between mb-4 px-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Mitra Terdekat</h2>
            <p className="text-xs text-gray-500">Teknisi profesional di sekitar Anda</p>
          </div>
        </div>
        <div className="px-4">
          <div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed border-gray-200">
            <p className="text-gray-500 text-sm">Belum ada mitra tersedia di sekitar Anda.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4 px-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Mitra Terdekat</h2>
          <p className="text-xs text-gray-500">Teknisi profesional di sekitar Anda</p>
        </div>
        <Link href="/providers" className="text-xs font-bold text-red-600 hover:underline">
          Lihat Semua
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar">
        {providers.map((prov) => (
          <Link
            href={`/provider/${prov._id}`}
            key={prov._id}
            className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 flex flex-col w-48 shrink-0"
          >
            {/* Image Cover */}
            <div className="aspect-[4/3] w-full bg-gray-100 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 z-10"></div>
              <Image
                src={prov.userId?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${prov.userId?.fullName || 'default'}`}
                alt={prov.userId?.fullName || 'Mitra'}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Rating Badge */}
              <div className="absolute bottom-2 left-2 z-20">
                <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-lg shadow-sm border border-white/50">
                  <span className="text-[10px] text-yellow-500">★</span>
                  <span className="text-[10px] font-bold text-gray-900">
                    {(prov.rating ?? 0).toFixed(1)}
                  </span>
                </div>
              </div>
              {/* Online Badge */}
              {prov.isOnline && (
                <div className="absolute top-2 right-2 z-20">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-3 flex-1 flex flex-col">
              <h3 className="font-bold text-sm text-gray-900 truncate group-hover:text-red-600 transition-colors">
                {prov.userId?.fullName || 'Nama Tidak Tersedia'}
              </h3>
              <p className="text-[10px] text-gray-500 truncate mt-0.5">
                {prov.userId?.address?.city || 'Lokasi tidak tersedia'}
              </p>

              {/* Services Preview */}
              <div className="mt-2 flex flex-wrap gap-1">
                {prov.services?.slice(0, 2).map((svc, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full truncate max-w-[80px]"
                  >
                    {svc.serviceId?.name || 'Layanan'}
                  </span>
                ))}
                {(prov.services?.length || 0) > 2 && (
                  <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full">
                    +{(prov.services?.length || 0) - 2}
                  </span>
                )}
              </div>

              {/* Price Range */}
              <div className="mt-auto pt-2 border-t border-gray-50">
                <p className="text-[10px] text-gray-400">Mulai dari</p>
                <p className="text-sm font-bold text-red-600">
                  {prov.services && prov.services.length > 0
                    ? new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(Math.min(...prov.services.map((s) => s.price || 0)))
                    : 'Hubungi CS'}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}