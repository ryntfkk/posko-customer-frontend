// src/app/(customer)/services/[category]/page.tsx
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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

// --- MODERN ICONS COMPONENTS ---
const Icons = {
  Filter: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  Location: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  // [UPDATED] Icon MapPin Solid untuk Badge Jarak
  MapPinSolid: () => (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  ),
  Price: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Star: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  Search: () => (
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
};

export default function ServiceCategoryPage() {
  const router = useRouter();
  const params = useParams();
  
  // Data State
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'price_asc' | 'price_desc' | 'rating'>('distance');
  const [showFilterMobile, setShowFilterMobile] = useState(false);

  // Refs & Debounce
  const requestIdRef = useRef<number>(0);
  const filterRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Category Logic
  const rawCategory = Array.isArray(params.category) ? params.category[0] : params.category;
  const categoryParam = decodeURIComponent(rawCategory || '').toLowerCase().trim();
  
  const categoryDisplayName = useMemo(() => {
    if (!categoryParam) return '';
    return categoryParam
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [categoryParam]);

  // Click Outside Listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterMobile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load User Profile
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
      } finally {
        setIsProfileLoaded(true);
      }
    };
    loadUserProfile();
  }, []);

  // Load Providers
  useEffect(() => {
    if (! isProfileLoaded) return;

    const loadProviders = async () => {
      const currentRequestId = ++requestIdRef.current;
      
      setIsLoading(true);
      try {
        let lat: number | undefined;
        let lng: number | undefined;

        if (userProfile?.location?.coordinates) {
          [lng, lat] = userProfile.location.coordinates;
        }

        console.log(`[Request ${currentRequestId}] Fetching providers for category:`, categoryParam);

        const response = await fetchProviders({
          lat,
          lng,
          category: categoryParam,
          search: debouncedSearch,
          sortBy: sortBy
        });

        if (currentRequestId === requestIdRef.current) {
          setProviders(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        if (currentRequestId === requestIdRef.current) {
          console.error("Gagal memuat data provider:", error);
          setProviders([]);
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadProviders();
  }, [categoryParam, debouncedSearch, sortBy, userProfile, isProfileLoaded]);

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
    if (! addr) return 'Lokasi Mitra';
    if (addr.district) return `Kec. ${addr.district}`;
    if (addr.city) return addr.city;
    return 'Lokasi Mitra';
  };

  const filterOptions = [
    { value: 'distance', Icon: Icons.Location, label: 'Terdekat' },
    { value: 'price_asc', Icon: Icons.Price, label: 'Termurah' },
    { value: 'rating', Icon: Icons.Star, label: 'Rating' },
  ];

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
          <div className="flex-1 overflow-hidden">
            <h1 className="text-lg lg:text-xl font-bold text-gray-900 truncate">Layanan {categoryDisplayName}</h1>
            <p className="text-xs text-gray-500 hidden lg:block">Temukan mitra terbaik di sekitar Anda</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 lg:py-6">
        
        {/* BASIC ORDER BANNER - CLEAN STYLE */}
        <section className="bg-white border border-gray-200 rounded-xl lg:rounded-2xl p-5 lg:p-6 mb-6 shadow-sm relative overflow-hidden group">
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -z-10 transform translate-x-10 -translate-y-10 group-hover:bg-red-100 transition-colors duration-700"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 bg-red-50 px-2.5 py-1 rounded-full border border-red-100 mb-3">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">
                  Basic Order
                </span>
              </div>
              
              <h2 className="text-lg lg:text-2xl font-bold text-gray-900 mb-1.5 leading-tight">
                Pesan Layanan {categoryDisplayName}
              </h2>
              <p className="text-xs lg:text-sm text-gray-500 font-medium leading-relaxed max-w-2xl">
                Pilih layanan yang Anda butuhkan, sistem akan otomatis mencarikan mitra terdekat untuk Anda.
              </p>

              <div className="flex items-center gap-x-4 gap-y-2 mt-4 flex-wrap">
                <div className="flex items-center gap-1.5 text-gray-600 text-[10px] lg:text-xs font-semibold">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span>Mitra Terdekat</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600 text-[10px] lg:text-xs font-semibold">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <span>Respons Cepat</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600 text-[10px] lg:text-xs font-semibold">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>Harga Standar</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleBasicOrder} 
              className="w-full lg:w-auto bg-red-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-red-700 transition-all shadow-md shadow-red-100 hover:shadow-lg hover:shadow-red-200 flex items-center justify-center gap-2 text-sm"
            >
              <span>Pesan Sekarang</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </section>

        {/* FILTER & SORT */}
        <div className="w-full mb-5">
          <div className="flex items-center gap-2 w-full">
            
            {/* SEARCH */}
            <div className="relative flex-1 min-w-0">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Icons.Search />
              </div>
              <input 
                type="text" 
                placeholder="Cari mitra atau lokasi..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 lg:py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all shadow-sm"
              />
            </div>

            {/* MOBILE FILTER BTN */}
            <div className="relative lg:hidden shrink-0" ref={filterRef}>
              <button 
                onClick={() => setShowFilterMobile(!showFilterMobile)} 
                className={`w-10 h-10 flex items-center justify-center bg-white border rounded-xl transition-colors shadow-sm ${
                  showFilterMobile ? 'border-red-500 text-red-600 bg-red-50' : 'border-gray-200 text-gray-600 hover:border-red-300'
                }`}
              >
                <Icons.Filter />
              </button>

              {/* DROPDOWN */}
              {showFilterMobile && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-1.5 flex flex-col gap-1 origin-top-right animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 mb-1">
                    Urutkan Berdasarkan
                  </div>
                  {filterOptions.map((opt) => (
                    <button 
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value as typeof sortBy); setShowFilterMobile(false); }}
                      className={`px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all w-full text-left ${
                        sortBy === opt.value 
                          ? 'bg-red-50 text-red-600' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <opt.Icon />
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* DESKTOP FILTER */}
            <div className="hidden lg:flex gap-2">
              {filterOptions.map((opt) => (
                <button 
                  key={opt.value}
                  onClick={() => setSortBy(opt.value as typeof sortBy)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold border flex items-center gap-2 transition-all ${
                    sortBy === opt.value 
                      ? 'bg-red-600 text-white border-red-600 shadow-md' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600'
                  }`}
                >
                  <opt.Icon />
                  {opt.label}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* CONTENT */}
        <section>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-3 gap-1">
            <h3 className="text-sm lg:text-lg font-bold text-gray-900">
              {providers.length} Mitra Ditemukan
            </h3>
            <p className="text-[11px] lg:text-xs text-gray-500 block">
              Atau pilih mitra langsung (Direct Order)
            </p>
          </div>

          {isLoading && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-6 animate-pulse">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-gray-200 rounded-2xl h-48 lg:h-64"></div>
              ))}
            </div>
          )}

          {! isLoading && providers.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 border-dashed">
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h4 className="text-base font-bold text-gray-900">Tidak ada mitra</h4>
              <p className="text-xs text-gray-500 mt-1">Belum ada mitra yang sesuai filter Anda di area ini.</p>
              <button onClick={() => { setSearchTerm(''); setSortBy('distance'); }} className="mt-4 text-xs font-bold text-red-600 hover:underline">Reset Filter</button>
            </div>
          )}

          {! isLoading && providers.length > 0 && (
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
                      sizes="(max-width: 768px) 50vw, 20vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                    
                    {/* RATING BADGE */}
                    <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] lg:text-[10px] font-bold text-white border border-white/10">
                      ⭐ {getRatingLabel(provider)}
                    </div>
                    
                    {/* [UPDATED] DISTANCE BADGE MENGGUNAKAN SVG */}
                    {provider.distance && (
                      <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] lg:text-[10px] font-medium text-gray-700 border border-white/20 shadow-sm">
                        <span className="text-red-500"><Icons.MapPinSolid /></span>
                        <span>{(provider.distance / 1000).toFixed(1)} km</span>
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
                    
                    {/* TAGS LAYANAN */}
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
                        Pesan
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