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

// Mengembalikan jarak dalam KM (number) untuk sorting
function getRawDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
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
  return R * c;
}

// Mengembalikan string format jarak untuk UI
function formatDistance(km: number) {
  if (km < 1) return `${(km * 1000).toFixed(0)} m`;
  return `${km.toFixed(1)} km`;
}

export default function ServiceCategoryPage() {
  const router = useRouter();
  const params = useParams();
  
  // Data State
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'price_asc' | 'price_desc' | 'rating'>('distance');
  const [showFilterMobile, setShowFilterMobile] = useState(false);

  const categoryParam = Array.isArray(params.category) ? params.category[0] : params.category;
  const categoryName = decodeURIComponent(categoryParam || 'Layanan').replace(/-/g, ' ');

  // 1. Load User Profile (Untuk Lokasi)
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

  // 2. Load Providers
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

  // 3. LOGIKA FILTER, SEARCH & SORTING
  const processedProviders = useMemo(() => {
    if (!categoryParam) return [];
    const activeCategory = normalize(categoryParam);
    const searchLower = searchTerm.toLowerCase();

    // A. Filter Kategori & Deduplikasi
    const uniqueMap = new Map<string, Provider>();
    providers.forEach((provider) => {
        const hasMatchingService = provider.services.some((svc: ProviderServiceItem) => 
            svc.serviceId && normalize(svc.serviceId.category).includes(activeCategory)
        );
        if (hasMatchingService && !uniqueMap.has(provider._id)) {
            uniqueMap.set(provider._id, provider);
        }
    });
    let result = Array.from(uniqueMap.values());

    // B. Filter Search (Nama Mitra, Lokasi, atau Nama Layanan)
    if (searchTerm) {
        result = result.filter(p => 
            p.userId.fullName.toLowerCase().includes(searchLower) ||
            (p.userId.address?.city || '').toLowerCase().includes(searchLower) ||
            (p.userId.address?.district || '').toLowerCase().includes(searchLower) ||
            p.services.some(s => s.serviceId?.name.toLowerCase().includes(searchLower)) // Search by service name
        );
    }

    // C. Helper untuk mendapatkan Harga Terendah Provider
    const getMinPrice = (p: Provider) => {
        const prices = p.services.filter(s => s.isActive).map(s => s.price);
        return prices.length ? Math.min(...prices) : Infinity;
    };

    // D. Helper untuk mendapatkan Jarak (Number)
    const getDist = (p: Provider) => {
        if (!userProfile?.location?.coordinates || !p.userId?.location?.coordinates) return Infinity;
        const [uLng, uLat] = userProfile.location.coordinates;
        const [pLng, pLat] = p.userId.location.coordinates;
        return getRawDistance(uLat, uLng, pLat, pLng);
    };

    // E. Sorting Logic
    result.sort((a, b) => {
        switch (sortBy) {
            case 'price_asc':
                return getMinPrice(a) - getMinPrice(b);
            case 'price_desc':
                return getMinPrice(b) - getMinPrice(a);
            case 'rating':
                return (b.rating || 0) - (a.rating || 0);
            case 'distance':
            default:
                return getDist(a) - getDist(b);
        }
    });

    return result;
  }, [providers, categoryParam, searchTerm, sortBy, userProfile]);

  // Handlers
  const handleBasicOrder = () => {
    const categoryQuery = categoryParam || 'ac';
    router.push(`/checkout?type=basic&category=${encodeURIComponent(categoryQuery)}`);
  };

  const handleOpenProvider = (providerId: string) => {
    router.push(`/provider/${providerId}`);
  };

  const getStartingPriceLabel = (provider: Provider) => {
    if (!provider.services || provider.services.length === 0) return 'Hubungi CS';
    const prices = provider.services
      .filter((s: ProviderServiceItem) => s.isActive)
      .map((s: ProviderServiceItem) => s.price);
      
    if (prices.length === 0) return 'Bervariasi';
    const minPrice = Math.min(...prices);
    return `Rp ${new Intl.NumberFormat('id-ID').format(minPrice)}`;
  };

  const getDistanceLabel = (provider: Provider) => {
    if (isUserLoading) return '...';
    if (!userProfile) return 'Login'; 
    if (!userProfile.location?.coordinates || userProfile.location.coordinates.length !== 2) return 'Set Loc';
    if (!provider.userId?.location?.coordinates) return 'N/A'; 

    const [userLng, userLat] = userProfile.location.coordinates;
    const [provLng, provLat] = provider.userId.location.coordinates;
    
    if (userLat === 0 && userLng === 0) return 'Set Loc';

    const dist = getRawDistance(userLat, userLng, provLat, provLng);
    return formatDistance(dist);
  };

  const getLocationName = (provider: Provider) => {
    const addr = provider.userId.address;
    const village = (addr as any)?.village; 
    if (village) return `Kel. ${village}`;
    if (addr?.district) return `Kec. ${addr.district}`;
    if (addr?.city) return addr.city;
    return 'Lokasi Mitra';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-16 font-sans">
      
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 lg:py-4 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="p-1 -ml-1 text-gray-600 hover:text-red-600 rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] lg:text-[11px] font-bold uppercase tracking-wide text-gray-400">Layanan</span>
            <h1 className="text-lg lg:text-xl font-bold text-gray-900 capitalize leading-none">{categoryName}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-4 lg:py-8 space-y-6">
        
        {/* HERO SECTION (Compact on Mobile) */}
        <section className="bg-gradient-to-br from-red-600 to-red-700 text-white rounded-2xl p-5 lg:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-lg shadow-red-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/80">
                <span className="bg-white/20 px-2 py-0.5 rounded">Rekomendasi</span>
            </div>
            <h2 className="text-xl lg:text-3xl font-black leading-tight">Butuh teknisi {categoryName}?</h2>
            <p className="text-white/90 text-xs lg:text-sm max-w-xl leading-relaxed">
              Pilih mitra di bawah atau biarkan sistem mencarikan yang terdekat.
            </p>
          </div>
          <button 
            onClick={handleBasicOrder} 
            className="relative z-10 self-start lg:self-auto px-5 py-2.5 lg:px-6 lg:py-3 bg-white text-red-600 text-xs lg:text-sm font-bold rounded-xl shadow-lg hover:-translate-y-0.5 transition-transform flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            Pesan Cepat (Basic)
          </button>
        </section>

        {/* FILTER & SEARCH BAR */}
        <div className="sticky top-[65px] lg:top-[80px] z-20 bg-gray-50/95 backdrop-blur py-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:bg-transparent">
            <div className="flex gap-2 lg:gap-4 items-center">
                {/* Search Input */}
                <div className="flex-1 relative">
                    <input 
                        type="text" 
                        placeholder="Cari nama mitra atau layanan..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm"
                    />
                    <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>

                {/* Desktop Sort */}
                <div className="hidden lg:block relative">
                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-xl text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer hover:bg-gray-50"
                    >
                        <option value="distance">📍 Terdekat</option>
                        <option value="rating">⭐ Rating Tertinggi</option>
                        <option value="price_asc">Rp Termurah</option>
                        <option value="price_desc">Rp Termahal</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>

                {/* Mobile Filter Button */}
                <button 
                    onClick={() => setShowFilterMobile(!showFilterMobile)}
                    className={`lg:hidden p-2.5 rounded-xl border shadow-sm flex items-center justify-center transition-colors ${showFilterMobile ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-600'}`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
                </button>
            </div>

            {/* Mobile Filter Dropdown */}
            {showFilterMobile && (
                <div className="lg:hidden mt-2 bg-white rounded-xl border border-gray-100 shadow-lg p-2 grid grid-cols-2 gap-2 animate-fadeIn">
                    {[
                        { label: 'Terdekat', val: 'distance', icon: '📍' },
                        { label: 'Rating', val: 'rating', icon: '⭐' },
                        { label: 'Termurah', val: 'price_asc', icon: 'Rp↓' },
                        { label: 'Termahal', val: 'price_desc', icon: 'Rp↑' }
                    ].map((opt) => (
                        <button 
                            key={opt.val}
                            onClick={() => { setSortBy(opt.val as any); setShowFilterMobile(false); }}
                            className={`text-xs font-bold py-2.5 px-3 rounded-lg flex items-center gap-2 transition-colors ${sortBy === opt.val ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
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
                {processedProviders.length} Mitra Tersedia
                <span className="text-xs font-normal text-gray-500 ml-2 hidden lg:inline">diurutkan berdasarkan {sortBy === 'distance' ? 'jarak' : sortBy === 'rating' ? 'rating' : 'harga'}</span>
            </h3>
          </div>

          {isLoading && (
             <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-6 animate-pulse">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="bg-gray-200 rounded-2xl h-48 lg:h-64"></div>
                ))}
             </div>
          )}

          {!isLoading && processedProviders.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 border-dashed">
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h4 className="text-base font-bold text-gray-900">Tidak ditemukan</h4>
              <p className="text-xs text-gray-500 mt-1">Coba ubah filter atau kata kunci pencarian.</p>
              <button onClick={() => { setSearchTerm(''); setSortBy('distance'); }} className="mt-4 text-xs font-bold text-red-600 hover:underline">Reset Filter</button>
            </div>
          )}

          {/* PROVIDER GRID */}
          {!isLoading && processedProviders.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-6">
              {processedProviders.map((provider) => (
                <button
                  key={provider._id}
                  onClick={() => handleOpenProvider(provider._id)}
                  className="flex flex-col bg-white rounded-xl lg:rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-red-100 hover:-translate-y-1 transition-all duration-300 group overflow-hidden text-left h-full"
                >
                  {/* Image Area - Aspect Ratio 4:3 agar tidak terlalu tinggi di mobile */}
                  <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-40 z-10"></div>
                    <Image 
                      src={provider.userId?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider.userId?.fullName || 'User'}`} 
                      alt={provider.userId?.fullName || 'Mitra'} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                    
                    {/* Badge Jarak (Pojok Kiri Bawah) */}
                    <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] lg:text-[10px] font-bold text-white border border-white/20">
                       <svg className="w-2.5 h-2.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                       {getDistanceLabel(provider)}
                    </div>

                    {/* Badge Rating (Pojok Kanan Atas) */}
                    <div className="absolute top-2 right-2 z-20 bg-white/90 backdrop-blur-md px-1.5 py-0.5 rounded-md shadow-sm flex items-center gap-0.5 border border-white/50">
                        <span className="text-[9px] text-yellow-500">★</span>
                        <span className="text-[9px] font-bold text-gray-800">{provider.rating ? provider.rating.toFixed(1) : 'New'}</span>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-2.5 lg:p-4 flex flex-col flex-1 gap-1">
                    <h4 className="text-xs lg:text-base font-bold text-gray-900 line-clamp-1 group-hover:text-red-600 transition-colors">
                      {provider.userId?.fullName}
                    </h4>
                    
                    {/* Lokasi Singkat */}
                    <p className="text-[10px] lg:text-xs text-gray-500 line-clamp-1">
                       {getLocationName(provider)}
                    </p>

                    {/* DAFTAR LAYANAN (TAGS) - NEW FEATURE */}
                    <div className="flex flex-wrap gap-1 my-1">
                        {provider.services
                            .filter(s => s.isActive)
                            .slice(0, 2) // Tampilkan max 2 layanan agar rapi di mobile
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

                    <div className="mt-auto pt-2 border-t border-gray-50 flex items-end justify-between gap-1">
                         <div className="flex flex-col">
                            <span className="text-[9px] text-gray-400 uppercase tracking-tight">Mulai</span>
                            <span className="text-xs lg:text-sm font-black text-red-600">
                                {getStartingPriceLabel(provider)}
                            </span>
                         </div>
                         <div className="w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-gray-50 text-gray-400 group-hover:bg-red-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                            <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                         </div>
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