// src/app/(customer)/services/[category]/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { fetchProviders } from '@/features/providers/api';
import { fetchProfile } from '@/features/auth/api';
import { Provider } from '@/features/providers/types';
import { User } from '@/features/auth/types';

// Hook Debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Interface untuk Service Item di dalam Provider
interface ProviderServiceItem {
  serviceId?: {
    _id: string;
    name: string;
    category: string;
    iconUrl?: string;
  };
  price: number;
  isActive: boolean;
}

export default function ServiceCategoryPage() {
  const router = useRouter();
  const params = useParams();
  
  // Data State
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'price_asc' | 'price_desc' | 'rating'>('distance');
  const [showFilterMobile, setShowFilterMobile] = useState(false);

  // Debounce search term
  const debouncedSearch = useDebounce(searchTerm, 500);

  // [FIX] Ambil parameter kategori dengan aman dan normalize ke lowercase
  const rawCategory = Array.isArray(params.category) ? params.category[0] : params.category;
  // Decode dan normalize: lowercase untuk konsistensi dengan backend
  const categoryParam = decodeURIComponent(rawCategory || '').toLowerCase().trim();
  
  // Konversi slug ke nama kategori yang readable untuk judul (capitalize first letter of each word)
  const categoryDisplayName = useMemo(() => {
    if (!categoryParam) return '';
    return categoryParam
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [categoryParam]);

  // Load User Profile (optional - untuk lokasi)
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const token = localStorage.getItem('posko_token');
        if (token) {
          const res = await fetchProfile();
          setUserProfile(res.data.profile);
        }
      } catch (error) {
        console.error("Gagal memuat profil user:", error);
      }
    };
    loadUserProfile();
  }, []);

  // Load Providers with Category Filter
  useEffect(() => {
    const loadProviders = async () => {
      setIsLoading(true);
      try {
        let lat: number | undefined;
        let lng: number | undefined;

        // Gunakan lokasi user jika tersedia
        if (userProfile?.location?.coordinates) {
          [lng, lat] = userProfile.location.coordinates;
        }

        console.log("Fetching providers for category:", categoryParam);

        const response = await fetchProviders({
          lat,
          lng,
          category: categoryParam, // [FIX] Kirim lowercase normalized
          search: debouncedSearch,
          sortBy: sortBy
        });

        console.log("Providers found:", response.data);
        setProviders(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Gagal memuat data provider:", error);
        setProviders([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Jalankan fetch setiap kali filter berubah
    loadProviders();
  }, [categoryParam, debouncedSearch, sortBy, userProfile]);

  // --- LOGIKA DISPLAY HELPER ---
  
  const handleBasicOrder = () => {
    const categoryQuery = categoryParam || 'ac';
    router.push(`/checkout?type=basic&category=${encodeURIComponent(categoryQuery)}`);
  };

  const handleOpenProvider = (providerId: string) => {
    router.push(`/provider/${providerId}`);
  };

  const getStartingPriceLabel = (provider: Provider) => {
    if (! provider.services || provider.services.length === 0) return 'Hubungi CS';
    const activeServices = provider.services.filter((s: ProviderServiceItem) => s.isActive);
    if (activeServices.length === 0) return 'Bervariasi';
    
    const prices = activeServices.map((s: ProviderServiceItem) => s.price);
    const minPrice = Math.min(...prices);
    return `Rp ${new Intl.NumberFormat('id-ID').format(minPrice)}`;
  };

  const getRatingLabel = (provider: Provider) => {
    if (provider.rating && provider.rating > 0) {
      return provider.rating.toFixed(1);
    }
    return 'Baru';
  };

  const getLocationLabel = (provider: Provider) => {
    const addr = provider.userId?.address;
    if (!addr) return 'Lokasi Mitra';
    if (addr.district) return `Kec.${addr.district}`;
    if (addr.city) return addr.city;
    return 'Lokasi Mitra';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-16 font-sans">
      
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 lg:py-4 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="p-1 -ml-1 text-gray-600 hover:text-red-600 rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-lg lg:text-xl font-bold text-gray-900">Layanan {categoryDisplayName}</h1>
            <p className="text-xs text-gray-500 hidden lg:block">Temukan mitra terbaik di sekitar Anda</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 lg:py-6">
        
        {/* PROMO BANNER */}
        <section className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 rounded-2xl p-5 lg:p-8 mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative overflow-hidden shadow-lg shadow-red-100">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-2xl lg:text-3xl font-black text-white mb-2">Promo Layanan {categoryDisplayName}!</h2>
            <p className="text-sm text-white/90 font-medium">Dapatkan diskon hingga <span className="font-bold text-lg">30%</span> untuk pengguna baru</p>
          </div>
          <button onClick={handleBasicOrder} className="relative z-10 bg-white text-red-600 font-bold px-6 py-3 rounded-xl hover:bg-red-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm lg:text-base">
            Pesan Sekarang →
          </button>
        </section>

        {/* FILTER & SORT */}
        <div className="flex flex-col lg:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Cari nama mitra atau lokasi..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 lg:py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>

          {/* Sort - Desktop */}
          <div className="hidden lg:flex gap-2">
            {[
              { value: 'distance', icon: '📍', label: 'Terdekat' },
              { value: 'price_asc', icon: '💰', label: 'Termurah' },
              { value: 'rating', icon: '⭐', label: 'Rating' },
            ].map((opt) => (
              <button 
                key={opt.value}
                onClick={() => setSortBy(opt.value as typeof sortBy)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                  sortBy === opt.value 
                    ? 'bg-red-600 text-white border-red-600 shadow-md' 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600'
                }`}
              >
                <span>{opt.icon}</span> {opt.label}
              </button>
            ))}
          </div>

          {/* Sort - Mobile */}
          <button 
            onClick={() => setShowFilterMobile(!showFilterMobile)} 
            className="lg:hidden bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 flex items-center justify-between hover:border-red-300 transition-colors"
          >
            <span>🎚️ Filter & Urutkan</span>
            <svg className={`w-4 h-4 transition-transform ${showFilterMobile ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Mobile Filter Dropdown */}
          {showFilterMobile && (
            <div className="lg:hidden flex flex-col gap-2 p-3 bg-white border border-gray-100 rounded-xl">
              {[
                { value: 'distance', icon: '📍', label: 'Terdekat' },
                { value: 'price_asc', icon: '💰', label: 'Termurah' },
                { value: 'rating', icon: '⭐', label: 'Rating' },
              ].map((opt) => (
                <button 
                  key={opt.value}
                  onClick={() => { setSortBy(opt.value as typeof sortBy); setShowFilterMobile(false); }}
                  className={`px-4 py-2.5 rounded-lg text-sm font-bold border transition-all text-left ${
                    sortBy === opt.value 
                      ? 'bg-red-600 text-white border-red-600' 
                      : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-red-50'
                  }`}
                >
                  <span>{opt.icon}</span> {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CONTENT SECTION */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm lg:text-lg font-bold text-gray-900">
              {providers.length} Mitra Ditemukan
              {searchTerm && <span className="text-gray-500"> untuk &quot;{searchTerm}&quot;</span>}
            </h3>
          </div>

          {isLoading && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-6 animate-pulse">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-gray-200 rounded-2xl h-48 lg:h-64"></div>
              ))}
            </div>
          )}

          {!isLoading && providers.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 border-dashed">
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h4 className="text-base font-bold text-gray-900">Tidak ada mitra</h4>
              <p className="text-xs text-gray-500 mt-1">Belum ada mitra yang sesuai filter Anda di area ini.</p>
              <button onClick={() => { setSearchTerm(''); setSortBy('distance'); }} className="mt-4 text-xs font-bold text-red-600 hover:underline">Reset Filter</button>
            </div>
          )}

          {!isLoading && providers.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-6">
              {providers.map((provider) => (
                <div 
                  key={provider._id} 
                  onClick={() => handleOpenProvider(provider._id)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer group hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative h-28 lg:h-36 bg-gray-100 overflow-hidden">
                    <Image 
                      src={provider.userId?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider.userId?.fullName || 'User'}`} 
                      alt={provider.userId?.fullName || 'Mitra'} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                    
                    <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] lg:text-[10px] font-bold text-white border border-white/10">
                      ⭐ {getRatingLabel(provider)}
                    </div>
                    
                    {provider.distance && (
                      <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] lg:text-[10px] font-medium text-gray-700">
                        📍 {(provider.distance / 1000).toFixed(1)} km
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-3 lg:p-4">
                    <h4 className="font-bold text-sm lg:text-base text-gray-900 truncate group-hover:text-red-600 transition-colors">
                      {provider.userId?.fullName || 'Mitra Posko'}
                    </h4>
                    <p className="text-[10px] lg:text-xs text-gray-500 truncate mt-0.5">
                      {getLocationLabel(provider)}
                    </p>
                    
                    {/* DAFTAR LAYANAN (TAGS) */}
                    <div className="flex flex-wrap gap-1 my-1">
                      {provider.services
                        .filter(s => s.isActive)
                        .slice(0, 2) 
                        .map((svc, idx) => (
                          <span key={idx} className="text-[9px] lg:text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200 line-clamp-1">
                            {svc.serviceId?.name}
                          </span>
                        ))
                      }
                      {provider.services.filter(s => s.isActive).length > 2 && (
                        <span className="text-[9px] lg:text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded border border-gray-100">
                          +{provider.services.filter(s => s.isActive).length - 2}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-end mt-2 pt-2 border-t border-gray-100">
                      <div>
                        <p className="text-[9px] lg:text-[10px] text-gray-400">Mulai dari</p>
                        <p className="text-xs lg:text-sm font-bold text-red-600">{getStartingPriceLabel(provider)}</p>
                      </div>
                      <button className="bg-red-50 text-red-600 p-1.5 lg:p-2 rounded-lg text-[10px] lg:text-xs font-bold hover:bg-red-100 transition-colors">
                        Lihat →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}