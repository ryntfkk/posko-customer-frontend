'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
// Import tipe dan API yang baru saja dibuat
import { fetchProviders } from '@/features/providers/api';
import { Provider, ProviderServiceItem } from '@/features/providers/types';
import { fetchProfile } from '@/features/auth/api';
import { User } from '@/features/auth/types';

// --- FUNGSI HELPER ---

// Normalisasi string untuk perbandingan kategori
const normalize = (value: string) => value.toLowerCase().replace(/-/g, ' ').trim();

// Rumus Haversine untuk hitung jarak (KM/Meter)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius bumi dalam KM
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
  
  // State Data
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State User Profile
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  const categoryParam = Array.isArray(params.category) ? params.category[0] : params.category;
  const categoryName = decodeURIComponent(categoryParam || 'Layanan').replace(/-/g, ' ');

  // 1. Ambil Lokasi User dari DATABASE
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

  // 2. Ambil Data Provider dari Backend
  useEffect(() => {
    const loadProviders = async () => {
      try {
        setIsLoading(true);
        const response = await fetchProviders();
        // Pastikan response.data adalah array
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

  // 3. Filter Provider berdasarkan Kategori
  const filteredProviders = useMemo(() => {
    if (!categoryParam) return providers;
    const activeCategory = normalize(categoryParam);

    return providers.filter((provider) => {
      // Fix Error Implicit Any: tambahkan tipe (svc: ProviderServiceItem)
      const hasMatchingService = provider.services.some((svc: ProviderServiceItem) => 
        svc.serviceId && normalize(svc.serviceId.category).includes(activeCategory)
      );
      return hasMatchingService;
    });
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
    
    // Fix Error Implicit Any: tambahkan tipe (s: ProviderServiceItem)
    const prices = provider.services
      .filter((s: ProviderServiceItem) => s.isActive)
      .map((s: ProviderServiceItem) => s.price);
      
    if (prices.length === 0) return 'Harga Bervariasi';
    
    const minPrice = Math.min(...prices);
    return `Mulai Rp ${new Intl.NumberFormat('id-ID').format(minPrice)}`;
  };

  const getSpecialty = (provider: Provider) => {
    if (!provider.services || provider.services.length === 0) return 'Umum';
    return provider.services[0].serviceId?.name || 'Teknisi Umum';
  };

  // Helper: Hitung Jarak
  const getDistanceLabel = (provider: Provider) => {
    if (isUserLoading) return '...';
    if (!userProfile) return 'Login info'; 

    if (!userProfile.location?.coordinates || userProfile.location.coordinates.length !== 2) {
        return 'Set Alamat';
    }

    if (!provider.userId?.location?.coordinates) {
        return 'Jauh'; 
    }

    const [userLng, userLat] = userProfile.location.coordinates;
    const [provLng, provLat] = provider.userId.location.coordinates;
    
    if (userLat === 0 && userLng === 0) return 'Set Alamat';

    return calculateDistance(userLat, userLng, provLat, provLng);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 font-sans">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-gray-600 hover:text-red-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Layanan</span>
            <h1 className="text-xl font-bold text-gray-900 capitalize">{categoryName}</h1>
          </div>
          <button 
            onClick={handleBasicOrder} 
            className="ml-auto px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-full hover:bg-red-700 transition-transform hover:-translate-y-0.5 shadow-md shadow-red-100"
          >
            Basic Order
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-8 space-y-8">
        <section className="bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-lg shadow-red-200/60">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Pilih Mitra</p>
            <h2 className="text-2xl font-black leading-tight">Temukan teknisi {categoryName} terbaik</h2>
            <p className="text-white/90 text-sm max-w-2xl leading-relaxed">
              Jarak dihitung berdasarkan alamat terdaftar Anda dan lokasi mitra.
            </p>
          </div>
          <button 
            onClick={handleBasicOrder} 
            className="self-start lg:self-auto px-6 py-3 bg-white text-red-600 font-bold rounded-xl shadow-lg hover:-translate-y-0.5 transition-transform"
          >
            Pesan Cepat Sekarang
          </button>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Mitra Tersedia</p>
              <h3 className="text-lg font-bold text-gray-900">{filteredProviders.length} Mitra Ditemukan</h3>
            </div>
          </div>

          {isLoading && (
             <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100">
                    <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
             </div>
          )}

          {!isLoading && filteredProviders.length === 0 && (
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

          {!isLoading && filteredProviders.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {filteredProviders.map((provider) => (
                <button
                  key={provider._id}
                  onClick={() => handleOpenProvider(provider._id)}
                  className="w-full text-left bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-red-100 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                      <Image 
                        src={provider.userId?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider.userId?.fullName || 'User'}`} 
                        alt={provider.userId?.fullName || 'Mitra'} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="text-lg font-bold text-gray-900 truncate group-hover:text-red-600 transition-colors">
                          {provider.userId?.fullName || 'Nama Tidak Tersedia'}
                        </h4>
                        
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                          {getDistanceLabel(provider)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-500 truncate mb-2">{getSpecialty(provider)}</p>
                      
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1 font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
                          <span className="text-yellow-500 text-xs">★</span>
                          {provider.rating || 'New'}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="font-bold text-red-600">{getStartingPrice(provider)}</span>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-gray-400 group-hover:text-red-600 transition-colors">
                      Detail
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}