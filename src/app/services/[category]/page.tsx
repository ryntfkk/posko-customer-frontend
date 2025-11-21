// src/app/services/[category]/page.tsx
'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchProviders } from '@/features/providers/api';
import { Provider, ProviderServiceItem } from '@/features/providers/types';
import { fetchProfile } from '@/features/auth/api';
import { User } from '@/features/auth/types';

// --- FUNGSI HELPER ---

const normalize = (value: string) => value.toLowerCase().replace(/-/g, ' ').trim();

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  if (distance < 1) return `${(distance * 1000).toFixed(0)} m`;
  return `${distance.toFixed(1)} km`;
}

export default function ServiceCategoryPage() {
  const router = useRouter();
  const params = useParams();
  
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  const categoryParam = Array.isArray(params.category) ? params.category[0] : params.category;
  const categoryName = decodeURIComponent(categoryParam || 'Layanan').replace(/-/g, ' ');

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setIsUserLoading(true);
        const token = localStorage.getItem('posko_token');
        if (token) {
            const response = await fetchProfile();
            setUserProfile(response.data.profile);
        }
      } catch (error) {
        console.warn("Gagal memuat profil:", error);
      } finally {
        setIsUserLoading(false);
      }
    };
    loadUserProfile();
  }, []);

  useEffect(() => {
    const loadProviders = async () => {
      try {
        setIsLoading(true);
        const response = await fetchProviders();
        setProviders(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Gagal memuat data provider:", error);
        setProviders([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadProviders();
  }, []);

  // LOGIKA DEDUPLIKASI PROVIDER
  const uniqueFilteredProviders = useMemo(() => {
    if (!categoryParam) return [];
    const activeCategory = normalize(categoryParam);

    const uniqueMap = new Map<string, Provider>();

    providers.forEach((provider) => {
        const hasMatchingService = provider.services.some((svc: ProviderServiceItem) => 
            svc.serviceId && normalize(svc.serviceId.category).includes(activeCategory)
        );

        if (hasMatchingService && !uniqueMap.has(provider._id)) {
            uniqueMap.set(provider._id, provider);
        }
    });

    return Array.from(uniqueMap.values());
  }, [providers, categoryParam]);

  const handleBasicOrder = () => {
    const categoryQuery = categoryParam || 'ac';
    router.push(`/checkout?type=basic&category=${encodeURIComponent(categoryQuery)}`);
  };

  const handleOpenProvider = (providerId: string) => {
    router.push(`/provider/${providerId}`);
  };

  const getStartingPrice = (provider: Provider) => {
    if (!provider.services || provider.services.length === 0) return 'Hubungi CS';
    const prices = provider.services
      .filter((s: ProviderServiceItem) => s.isActive)
      .map((s: ProviderServiceItem) => s.price);
      
    if (prices.length === 0) return 'Harga Bervariasi';
    const minPrice = Math.min(...prices);
    return `Mulai Rp ${new Intl.NumberFormat('id-ID').format(minPrice)}`;
  };

  const getDistanceLabel = (provider: Provider) => {
    if (isUserLoading) return '...';
    if (!userProfile) return 'Login info'; 
    if (!userProfile.location?.coordinates || userProfile.location.coordinates.length !== 2) return 'Set Alamat';
    if (!provider.userId?.location?.coordinates) return 'Jauh'; 

    const [userLng, userLat] = userProfile.location.coordinates;
    const [provLng, provLat] = provider.userId.location.coordinates;
    
    if (userLat === 0 && userLng === 0) return 'Set Alamat';

    return calculateDistance(userLat, userLng, provLat, provLng);
  };

  // Helper untuk menampilkan lokasi (Village/Kelurahan)
  const getLocationName = (provider: Provider) => {
    const addr = provider.userId.address;
    // Gunakan Village jika ada, fallback ke District atau City
    // Note: Pastikan tipe data ProviderUser di types.ts sudah mencakup field 'village' jika backend mengirimnya
    // Jika belum ada di types, kita akses via (addr as any).village atau update types.
    const village = (addr as any)?.village; 
    if (village) return `Kel. ${village}`;
    if (addr?.district) return `Kec. ${addr.district}`;
    if (addr?.city) return addr.city;
    return 'Lokasi Mitra';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 font-sans">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-gray-600 hover:text-red-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Layanan</span>
            <h1 className="text-xl font-bold text-gray-900 capitalize">{categoryName}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8 space-y-8">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-lg shadow-red-200/60">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Pilih Mitra</p>
            <h2 className="text-2xl font-black leading-tight">Temukan teknisi {categoryName} terbaik</h2>
            <p className="text-white/90 text-sm max-w-2xl leading-relaxed">
              Pilih mitra terdekat atau gunakan Basic Order untuk pencarian otomatis.
            </p>
          </div>
          <button 
            onClick={handleBasicOrder} 
            className="self-start lg:self-auto px-6 py-3 bg-white text-red-600 font-bold rounded-xl shadow-lg hover:-translate-y-0.5 transition-transform"
          >
            Pesan Cepat (Basic Order)
          </button>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Mitra Tersedia</p>
              <h3 className="text-lg font-bold text-gray-900">{uniqueFilteredProviders.length} Mitra Ditemukan</h3>
            </div>
          </div>

          {isLoading && (
             <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-6 animate-pulse">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 h-64"></div>
                ))}
             </div>
          )}

          {!isLoading && uniqueFilteredProviders.length === 0 && (
            <div className="text-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900">Belum ada mitra tersedia</h4>
              <p className="text-gray-500 mt-2 max-w-md">
                Kami belum menemukan mitra untuk kategori "{categoryName}" di area ini.
              </p>
            </div>
          )}

          {/* --- START UPDATE GRID LAYOUT --- */}
          {!isLoading && uniqueFilteredProviders.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-6">
              {uniqueFilteredProviders.map((provider) => (
                <button
                  key={provider._id}
                  onClick={() => handleOpenProvider(provider._id)}
                  className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-red-100 hover:-translate-y-1 transition-all duration-300 group overflow-hidden text-left h-full"
                >
                  {/* Image Area */}
                  <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
                    <Image 
                      src={provider.userId?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider.userId?.fullName || 'User'}`} 
                      alt={provider.userId?.fullName || 'Mitra'} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                    {/* Badge Jarak */}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-blue-600 shadow-sm border border-blue-50 flex items-center gap-1">
                       📍 {getDistanceLabel(provider)}
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-3 flex flex-col flex-1">
                    <h4 className="text-sm lg:text-base font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-red-600 transition-colors">
                      {provider.userId?.fullName || 'Mitra Posko'}
                    </h4>
                    
                    {/* Data Village / Lokasi */}
                    <p className="text-[10px] lg:text-xs text-gray-500 flex items-center gap-1 mb-2">
                       <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                       {getLocationName(provider)}
                    </p>

                    <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between">
                         <div className="flex items-center gap-1 text-xs font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                            <span className="text-yellow-500 text-[10px]">★</span> {provider.rating || 'New'}
                         </div>
                         <span className="text-xs font-black text-red-600">
                            {getStartingPrice(provider)}
                         </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {/* --- END UPDATE GRID LAYOUT --- */}
        </section>
      </main>
    </div>
  );
}