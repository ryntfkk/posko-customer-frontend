// src/app/services/[category]/page.tsx
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { fetchProviders } from '@/features/providers/api';
import { fetchProfile } from '@/features/auth/api';
import { Provider } from '@/features/providers/types';
import { User } from '@/features/auth/types';

// --- HOOKS ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- TYPES ---
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

// --- ICONS (Optimized Size) ---
const Icons = {
  Location: () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  MapPinSolid: () => (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  ),
  Price: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Star: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  Search: () => (
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Bolt: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  Check: () => (
     <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
     </svg>
  ),
  ShieldCheck: () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
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
  
  // Desktop Popup Filter State
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Refs & Debounce
  const requestIdRef = useRef<number>(0);
  const debouncedSearch = useDebounce(searchTerm, 400);

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

  // Click Outside Listener for Popups
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setActivePopup(null);
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
    if (!isProfileLoaded) return;

    const loadProviders = async () => {
      const currentRequestId = ++requestIdRef.current;
      
      setIsLoading(true);
      try {
        let lat: number | undefined;
        let lng: number | undefined;

        if (userProfile?.location?.coordinates) {
          [lng, lat] = userProfile.location.coordinates;
        }

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

  // --- HELPERS ---
  const handleBasicOrder = () => {
    const categoryQuery = categoryParam || 'ac';
    router.push(`/checkout?type=basic&category=${encodeURIComponent(categoryQuery)}`);
  };

  const handleOpenProvider = (providerId: string) => {
    router.push(`/provider/${providerId}`);
  };

  const getStartingPriceLabel = (provider: Provider) => {
    if (!provider.services || provider.services.length === 0) return 'Hubungi CS';
    const activeServices = provider.services.filter((s: ProviderServiceItem) => s.isActive);
    if (activeServices.length === 0) return 'Bervariasi';
    
    const prices = activeServices.map((s: ProviderServiceItem) => s.price);
    const minPrice = Math.min(...prices);
    return `Rp${new Intl.NumberFormat('id-ID').format(minPrice)}`;
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
    if (addr.district) return `Kec. ${addr.district}`;
    if (addr.city) return addr.city;
    return 'Lokasi Mitra';
  };

  const filterOptions = [
    { value: 'distance', label: 'Terdekat' },
    { value: 'price_asc', label: 'Harga Terendah' },
    { value: 'rating', label: 'Rating Tertinggi' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-12 font-sans">
      
      {/* --- HEADER (Sticky) --- */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2.5 flex items-center gap-3">
          <button 
            onClick={() => router.push('/')} 
            className="p-1.5 -ml-1 text-gray-600 hover:text-red-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Icons.ChevronLeft />
          </button>
          
          <div className="flex-1 relative">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Icons.Search />
              </div>
             <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Cari layanan ${categoryDisplayName}...`}
                className="w-full bg-gray-100/80 border-0 rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-1 focus:ring-red-500 focus:bg-white transition-all placeholder:text-gray-400"
             />
          </div>
        </div>
        
        {/* MOBILE FILTER BAR (Horizontal Scroll) */}
        <div className="lg:hidden px-4 py-2 bg-white border-b border-gray-100 overflow-x-auto no-scrollbar flex gap-2">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value as typeof sortBy)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  sortBy === opt.value
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
        
        {/* DESKTOP FILTER BAR (Popup Style) */}
        <div className="hidden lg:flex items-center gap-3 mb-6 relative" ref={popupRef}>
          <span className="text-sm font-bold text-gray-700 mr-2">Urutkan:</span>
          
          {/* Button Trigger Popup */}
          <button 
            onClick={() => setActivePopup(activePopup === 'sort' ? null : 'sort')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border flex items-center gap-2 transition-all ${
               sortBy ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
             {filterOptions.find(f => f.value === sortBy)?.label || 'Pilih Urutan'}
             <Icons.ChevronDown />
          </button>

          {/* THE POPUP */}
          {activePopup === 'sort' && (
            <div className="absolute top-full left-16 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-1 flex flex-col animate-fadeIn">
               {filterOptions.map((opt) => (
                 <button
                   key={opt.value}
                   onClick={() => { setSortBy(opt.value as typeof sortBy); setActivePopup(null); }}
                   className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-red-600 text-left"
                 >
                   {opt.label}
                   {sortBy === opt.value && <Icons.Check />}
                 </button>
               ))}
            </div>
          )}
        </div>

        {/* --- MAIN CONTENT --- */}
        <main>
          
          {/* SLIM BANNER WITH ADVANTAGES */}
          <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden mb-5">
             <div className="bg-gradient-to-r from-red-600 to-red-500 px-4 py-3 flex items-center justify-between text-white relative overflow-hidden">
                {/* Decorative BG */}
                <div className="absolute -right-4 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

                <div className="relative z-10">
                   <div className="flex items-center gap-2 mb-0.5">
                      <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm">Basic Order</span>
                   </div>
                   <h2 className="text-sm lg:text-base font-bold">Pesan Kilat {categoryDisplayName}</h2>
                </div>
                
                <button 
                   onClick={handleBasicOrder}
                   className="relative z-10 bg-white text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 shadow-sm transition-all flex items-center gap-1.5"
                >
                   <Icons.Bolt />
                   Pesan Sekarang
                </button>
             </div>
             
             {/* ADVANTAGES ROW (Keunggulan) */}
             <div className="px-3 py-2 bg-red-50/50 flex items-center justify-between lg:justify-start lg:gap-8">
                <div className="flex items-center gap-1.5 text-[10px] lg:text-xs text-gray-600 font-medium">
                   <Icons.MapPinSolid />
                   <span>Mitra Terdekat</span>
                </div>
                <div className="w-px h-3 bg-red-200 lg:hidden"></div>
                <div className="flex items-center gap-1.5 text-[10px] lg:text-xs text-gray-600 font-medium">
                   <Icons.ShieldCheck />
                   <span>Respons Cepat</span>
                </div>
                <div className="w-px h-3 bg-red-200 lg:hidden"></div>
                <div className="flex items-center gap-1.5 text-[10px] lg:text-xs text-gray-600 font-medium">
                   <Icons.Price />
                   <span>Harga Standar</span>
                </div>
             </div>
          </div>

          {/* RESULTS HEADER */}
          <div className="flex items-end justify-between mb-3">
            <h1 className="text-sm lg:text-base font-bold text-gray-900">
              {isLoading ? 'Memuat...' : `${providers.length} Mitra Tersedia`}
            </h1>
            {!isLoading && (
              <span className="text-[10px] lg:text-xs text-gray-500">
                Lokasi: {userProfile?.address?.district ? `Kec. ${userProfile.address.district}` : 'Sekitar Anda'}
              </span>
            )}
          </div>

          {/* PROVIDER LIST */}
          {isLoading ? (
             <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-5 animate-pulse">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-white rounded-xl h-48 border border-gray-100"></div>
                ))}
             </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-300">
                 <Icons.Search />
              </div>
              <p className="text-xs font-medium text-gray-900">Tidak ada mitra ditemukan</p>
              <button onClick={() => { setSearchTerm(''); setSortBy('distance'); }} className="mt-3 text-xs text-red-600 font-bold hover:underline">
                Reset Filter
              </button>
            </div>
          ) : (
            // GRID: Mobile 2 Kolom (grid-cols-2), Desktop 5 Kolom (grid-cols-5)
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-5">
              {providers.map((provider) => (
                <div 
                  key={provider._id}
                  onClick={() => handleOpenProvider(provider._id)}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:border-red-200 hover:shadow-md transition-all group flex flex-col h-full"
                >
                  {/* THUMBNAIL (Compact Height) */}
                  <div className="relative h-28 lg:h-40 bg-gray-100 overflow-hidden shrink-0">
                    <Image 
                      src={provider.userId?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider.userId?.fullName || 'User'}`} 
                      alt={provider.userId?.fullName || 'Mitra'} 
                      fill 
                      sizes="(max-width: 768px) 50vw, 20vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    
                    {/* Rating Badge */}
                    <div className="absolute bottom-1.5 left-1.5 bg-black/50 backdrop-blur-[2px] rounded px-1.5 py-0.5 flex items-center gap-0.5 text-[9px] lg:text-[10px] font-bold text-white">
                      <span className="text-yellow-400">★</span> {getRatingLabel(provider)}
                    </div>
                    
                    {/* Distance Badge */}
                    {provider.distance && (
                       <div className="absolute bottom-1.5 right-1.5 bg-white/90 backdrop-blur-[2px] rounded px-1.5 py-0.5 flex items-center gap-0.5 text-[9px] lg:text-[10px] font-bold text-gray-700 shadow-sm">
                         <span className="text-red-500"><Icons.MapPinSolid /></span>
                         {(provider.distance / 1000).toFixed(1)} km
                       </div>
                    )}
                  </div>

                  {/* CONTENT (Vertical Compact) */}
                  <div className="p-2.5 lg:p-3 flex-1 flex flex-col">
                    <div className="flex justify-between items-start gap-1">
                        <h4 className="text-xs lg:text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-red-600 transition-colors">
                           {provider.userId?.fullName || 'Mitra'}
                        </h4>
                        {/* Online Dot */}
                        {provider.isOnline && <span className="w-1.5 h-1.5 bg-green-500 rounded-full shrink-0 mt-1"></span>}
                    </div>
                    
                    <p className="text-[10px] text-gray-500 truncate mt-0.5 mb-1.5 flex items-center gap-1">
                       <Icons.Location /> {getLocationLabel(provider)}
                    </p>

                    {/* Services Tags (Ultra Compact) */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {provider.services
                        .filter(s => s.isActive)
                        .slice(0, 1) // Cuma tampilkan 1 service utama di mobile biar ga penuh
                        .map((svc, idx) => (
                          <span key={idx} className="text-[9px] bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded border border-gray-100 line-clamp-1">
                            {svc.serviceId?.name}
                          </span>
                        ))
                      }
                      {provider.services.filter(s => s.isActive).length > 1 && (
                         <span className="text-[9px] text-gray-400 px-1">+{provider.services.filter(s => s.isActive).length - 1}</span>
                      )}
                    </div>

                    {/* Price Footer */}
                    <div className="mt-auto pt-2 border-t border-gray-50">
                       <p className="text-[9px] text-gray-400">Mulai dari</p>
                       <p className="text-xs lg:text-sm font-bold text-red-600">{getStartingPriceLabel(provider)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}