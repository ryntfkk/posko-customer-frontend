// src/app/(customer)/search/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { fetchProviders, FetchProvidersParams } from '@/features/providers/api';
import { Provider } from '@/features/providers/types';

// --- 1. Helper Hitung Jarak (Ditambahkan) ---
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

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Memuat pencarian...</div>}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';

  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(query);
  
  // --- 2. State untuk Lokasi User (Ditambahkan) ---
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Effect: Ambil Lokasi User saat halaman dibuka
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Izin lokasi ditolak/error:', error);
        }
      );
    }
  }, []);

  // Effect: Fetch Data Provider
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const params: FetchProvidersParams = { 
          limit: 20,
          search: query, 
        };
        
        // Jika lokasi user sudah ada, kirim ke API agar hasil urut berdasarkan jarak (opsional, tergantung backend)
        if (userLocation) {
            params.lat = userLocation.lat;
            params.lng = userLocation.lng;
        }

        const res = await fetchProviders(params);
        setProviders(res.data || []);
      } catch (error) {
        console.error("Error fetching providers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [query, category, userLocation]); // Re-fetch jika lokasi user ditemukan

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header Search */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4">
            <form onSubmit={handleSearch} className="relative">
                <Link href="/" className="absolute left-3 top-3.5 text-gray-500 hover:text-red-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </Link>
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari layanan atau nama mitra..." 
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
                <button type="submit" className="absolute right-3 top-2 bg-red-600 text-white p-1.5 rounded-lg hover:bg-red-700 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
            </form>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 flex justify-between items-end">
            <div>
                <h1 className="text-xl font-bold text-gray-900">
                    {query ? `Hasil pencarian "${query}"` : 'Semua Mitra Layanan'}
                </h1>
                <p className="text-sm text-gray-500">{providers.length} mitra ditemukan</p>
            </div>
            {/* Indikator Lokasi (Opsional) */}
            {!userLocation && (
                <p className="text-xs text-orange-500 hidden md:block">
                    *Aktifkan lokasi untuk melihat jarak
                </p>
            )}
        </div>

        {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1,2,3,4,5,6,7,8].map(i => (
                    <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-gray-100"></div>
                ))}
            </div>
        ) : providers.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Tidak ditemukan</h3>
                <p className="text-gray-500">Coba kata kunci lain atau area yang berbeda.</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {providers.map((prov) => {
                    // --- Logic Jarak (Ditambahkan) ---
                    let distanceStr = null;
                    if (userLocation && prov.userId?.location?.coordinates) {
                        const provLng = prov.userId.location.coordinates[0];
                        const provLat = prov.userId.location.coordinates[1];
                        distanceStr = calculateDistance(userLocation.lat, userLocation.lng, provLat, provLng);
                    }

                    // Helpers Lain
                    const getLocationLabel = () => {
                        const addr = prov.userId?.address;
                        if (!addr) return 'Lokasi Mitra';
                        if (addr.district) return `Kec. ${addr.district}`;
                        if (addr.city) return addr.city;
                        return 'Lokasi Mitra';
                    };
                    const activeServices = prov.services || [];
                    const minPrice = activeServices.length > 0 
                        ? Math.min(...activeServices.map((s) => s.price || 0)) 
                        : 0;

                    return (
                        <Link
                            href={`/provider/${prov._id}`}
                            key={prov._id}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                        >
                            {/* --- Image Section --- */}
                            <div className="relative h-28 lg:h-36 bg-gray-100 overflow-hidden shrink-0">
                                <Image
                                    src={prov.userId?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${prov.userId?.fullName || 'default'}`}
                                    alt={prov.userId?.fullName || 'Mitra'}
                                    fill
                                    sizes="(max-width: 768px) 50vw, 25vw"
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                />

                                {/* Rating Badge */}
                                <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] lg:text-[10px] font-bold text-white border border-white/10">
                                    <span>⭐</span>
                                    <span>{(prov.rating && prov.rating > 0) ? prov.rating.toFixed(1) : 'Baru'}</span>
                                </div>

                                {/* Online Badge */}
                                {prov.isOnline && (
                                    <div className="absolute top-2 right-2 z-20">
                                        <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
                                    </div>
                                )}

                                {/* --- 3. Badge Jarak (Ditambahkan) --- */}
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
                                <h4 className="font-bold text-sm lg:text-base text-gray-900 truncate group-hover:text-red-600 transition-colors">
                                    {prov.userId?.fullName || 'Mitra Posko'}
                                </h4>
                                <p className="text-[10px] lg:text-xs text-gray-500 truncate mt-0.5">
                                    {getLocationLabel()}
                                </p>

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
                                    <button className="bg-red-50 text-red-600 p-1.5 lg:p-2 rounded-lg text-[10px] lg:text-xs font-bold hover:bg-red-100 transition-colors">
                                        Pesan
                                    </button>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        )}
      </div>
    </main>
  );
}