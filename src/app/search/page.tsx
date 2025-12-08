// src/app/search/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense, useRef } from 'react';
import { fetchProviders, FetchProvidersParams } from '@/features/providers/api';
import { fetchProfile } from '@/features/auth/api';
import { Provider } from '@/features/providers/types';
import { User } from '@/features/auth/types';

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
  Search: () => (
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
  Filter: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  )
};

// --- Helper Hitung Jarak (Client Side Calculation jika Backend null) ---
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
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
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">Memuat pencarian...</div>}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  
  // State
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(query);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  
  // Filter & Sort State
  const [sortBy, setSortBy] = useState<'distance' | 'price_asc' | 'rating'>('distance');
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Click Outside Listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setActivePopup(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. Fetch User Profile
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

  // 2. Fetch Providers
  useEffect(() => {
    if (!isProfileLoaded) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const params: FetchProvidersParams = { 
          limit: 20,
          search: query,
          sortBy: sortBy
        };
        
        if (userProfile?.location?.coordinates) {
          const [lng, lat] = userProfile.location.coordinates;
          params.lat = lat;
          params.lng = lng;
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
  }, [query, sortBy, userProfile, isProfileLoaded]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    router.push(`/search?${params.toString()}`);
  };

  // User Coordinates for Fallback Distance Calculation
  const getUserCoordinates = () => {
    if (userProfile?.location?.coordinates) {
      return {
        lng: userProfile.location.coordinates[0],
        lat: userProfile.location.coordinates[1]
      };
    }
    return null;
  };
  const userCoords = getUserCoordinates();

  const filterOptions = [
    { value: 'distance', label: 'Terdekat' },
    { value: 'price_asc', label: 'Harga Terendah' },
    { value: 'rating', label: 'Rating Tertinggi' },
  ];

  return (
    <main className="min-h-screen bg-gray-50 pb-20 lg:pb-12 font-sans">
      
      {/* --- HEADER (Sticky) --- */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2.5 flex items-center gap-3">
            <Link href="/" className="p-1.5 -ml-1 text-gray-600 hover:text-red-600 rounded-full hover:bg-gray-100 transition-colors">
                <Icons.ChevronLeft />
            </Link>
            
            <form onSubmit={handleSearch} className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <Icons.Search />
                </div>
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari layanan atau nama mitra..." 
                    className="w-full bg-gray-100/80 border-0 rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-1 focus:ring-red-500 focus:bg-white transition-all placeholder:text-gray-400"
                />
            </form>
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
        <div className="hidden lg:flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 relative" ref={popupRef}>
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
                    <div className="absolute top-full left-16 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-1 flex flex-col animate-fadeIn origin-top-left">
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

            <p className="text-xs text-gray-500">
                Menampilkan {providers.length} hasil untuk &quot;{query}&quot;
            </p>
        </div>

        {/* MOBILE RESULTS TEXT */}
        <div className="lg:hidden mb-3">
             <h1 className="text-sm font-bold text-gray-900">
                {query ? `Hasil: "${query}"` : 'Semua Mitra'}
             </h1>
             <p className="text-[10px] text-gray-500">{providers.length} mitra ditemukan</p>
        </div>

        {/* --- CONTENT GRID --- */}
        {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-5 animate-pulse">
                {[1,2,3,4,5,6,7,8].map(i => (
                    <div key={i} className="bg-white rounded-xl h-48 border border-gray-100"></div>
                ))}
            </div>
        ) : providers.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icons.Search />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Tidak ditemukan</h3>
                <p className="text-xs text-gray-500 mt-1">Coba kata kunci lain atau area yang berbeda.</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-5">
                {providers.map((prov) => {
                    let distanceStr = null;
                    
                    // Logic Hitung Jarak: Prioritaskan dari API, fallback ke kalkulasi manual client-side
                    if (prov.distance) {
                        distanceStr = (prov.distance / 1000).toFixed(1);
                    } else if (userCoords && prov.userId?.location?.coordinates) {
                        const provLng = prov.userId.location.coordinates[0];
                        const provLat = prov.userId.location.coordinates[1];
                        distanceStr = calculateDistance(userCoords.lat, userCoords.lng, provLat, provLng);
                    }

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
                            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer group hover:border-red-200 hover:shadow-md transition-all duration-300 flex flex-col h-full"
                        >
                            {/* --- Image Section --- */}
                            <div className="relative h-28 lg:h-40 bg-gray-100 overflow-hidden shrink-0">
                                <Image
                                    src={prov.userId?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${prov.userId?.fullName || 'default'}`}
                                    alt={prov.userId?.fullName || 'Mitra'}
                                    fill
                                    sizes="(max-width: 768px) 50vw, 20vw"
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />

                                {/* Rating Badge */}
                                <div className="absolute bottom-1.5 left-1.5 z-20 flex items-center gap-0.5 bg-black/50 backdrop-blur-[2px] px-1.5 py-0.5 rounded text-[9px] lg:text-[10px] font-bold text-white">
                                    <span className="text-yellow-400">★</span>
                                    <span>{(prov.rating && prov.rating > 0) ? prov.rating.toFixed(1) : 'Baru'}</span>
                                </div>

                                {/* Distance Badge */}
                                {distanceStr && (
                                    <div className="absolute bottom-1.5 right-1.5 z-20 flex items-center gap-0.5 bg-white/90 backdrop-blur-[2px] px-1.5 py-0.5 rounded text-[9px] lg:text-[10px] font-bold text-gray-700 shadow-sm">
                                        <span className="text-red-500"><Icons.MapPinSolid /></span>
                                        <span>{distanceStr} km</span>
                                    </div>
                                )}
                            </div>

                            {/* --- Content Section --- */}
                            <div className="p-2.5 lg:p-3 flex flex-col flex-1">
                                <div className="flex justify-between items-start gap-1">
                                    <h4 className="font-bold text-xs lg:text-sm text-gray-900 truncate group-hover:text-red-600 transition-colors">
                                        {prov.userId?.fullName || 'Mitra Posko'}
                                    </h4>
                                    {/* Online Dot */}
                                    {prov.isOnline && <span className="w-1.5 h-1.5 bg-green-500 rounded-full shrink-0 mt-1"></span>}
                                </div>
                                
                                <p className="text-[10px] text-gray-500 truncate mt-0.5 mb-1.5 flex items-center gap-1">
                                   <Icons.Location />
                                   {getLocationLabel()}
                                </p>

                                {/* Tags (Ultra Compact) */}
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {activeServices.slice(0, 1).map((svc, idx) => (
                                        <span key={idx} className="text-[9px] bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded border border-gray-100 line-clamp-1">
                                            {svc.serviceId?.name || 'Layanan'}
                                        </span>
                                    ))}
                                    {activeServices.length > 1 && (
                                        <span className="text-[9px] text-gray-400 px-1">
                                            +{activeServices.length - 1}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-auto pt-2 border-t border-gray-50">
                                    <p className="text-[9px] text-gray-400">Mulai dari</p>
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