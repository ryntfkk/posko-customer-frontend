// src/app/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// --- API & TYPES ---
import { fetchProfile, switchRole, registerPartner } from '@/features/auth/api';
import { User } from '@/features/auth/types';
import { fetchServices } from '@/features/services/api';
import { Service } from '@/features/services/types';
import { voucherApi } from '@/features/vouchers/api';
import { Voucher } from '@/features/vouchers/types';
import { useCart } from '@/features/cart/useCart'; 
import { useLanguage } from '@/context/LanguageContext';

// --- KOMPONEN EKSISTING ---
import LanguageSwitcher from '@/components/LanguageSwitcher'; 
import TechnicianSection from '@/components/home/TechnicianSection';
import ServiceCategories from '@/components/home/ServiceCategories';
import ChatWidget from '@/components/ChatWidget';

// --- KOMPONEN BARU ---
import HomeBanner from '@/components/home/HomeBanner';
import BecomePartnerSection from '@/components/home/BecomePartnerSection';
import Footer from '@/components/Footer';

// --- ICONS ---
const SearchIcon = ({ className = "w-4 h-4" }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const OrderIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
const UserIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

export default function HomePage() {
  const router = useRouter();
  const { totalItems, totalAmount, cart } = useCart(); 
  const { t, language } = useLanguage();

  // State Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data State
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [promos, setPromos] = useState<Voucher[]>([]);
  const [isLoadingPromos, setIsLoadingPromos] = useState(true);
  
  // Helpers Profile
  const profileName = userProfile?.fullName || 'User Posko';
  const profileEmail = userProfile?.email || '-';
  const profileBadge = userProfile?.activeRole ? userProfile.activeRole.charAt(0).toUpperCase() + userProfile.activeRole.slice(1) : 'Member';
  const profileAvatar = userProfile?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profileName)}`;
  const isProviderMode = userProfile?.activeRole === 'provider';
  const hasProviderRole = userProfile?.roles.includes('provider');

  // Fetch Services
  useEffect(() => {
    fetchServices()
      .then(res => setServices(res.data || []))
      .catch(err => console.error("Gagal memuat layanan:", err))
      .finally(() => setIsLoadingServices(false));
  }, []);

  // Fetch Vouchers
  useEffect(() => {
    voucherApi.getAvailableVouchers()
        .then(res => setPromos(res.data || []))
        .catch(err => console.error("Gagal memuat promo:", err))
        .finally(() => setIsLoadingPromos(false));
  }, []);

  // Fetch User Profile
  useEffect(() => {
    const token = localStorage.getItem('posko_token');
    
    if (!!token !== isLoggedIn) {
      setIsLoggedIn(!!token);
    }
    
    if (token) {
      fetchProfile()
        .then(res => setUserProfile(res.data.profile))
        .catch(() => { 
          localStorage.removeItem('posko_token'); 
          setIsLoggedIn(false); 
        })
        .finally(() => setIsLoadingProfile(false));
    } else {
      setIsLoadingProfile(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect Provider
  useEffect(() => {
    if (!isLoadingProfile && isProviderMode) {
      router.replace('/dashboard');
    }
  }, [isProviderMode, isLoadingProfile, router]);

  // Group Services
  const groupServicesToCategories = (services: Service[]) => {
    const categoriesMap = new Map();
    services.forEach(service => {
        const normalizedCategory = service.category.trim().toLowerCase();
        const categoryKey = normalizedCategory;
        
        if (!categoriesMap.has(categoryKey)) {
            categoriesMap.set(categoryKey, {
                name: service.category, 
                slug: normalizedCategory.replace(/\s+/g, '-'), 
                iconUrl: service.iconUrl, 
            });
        }
    });
    return Array.from(categoriesMap.values());
  };

  const categories = useMemo(() => groupServicesToCategories(services), [services]);

  // Checkout URL
  const checkoutUrl = useMemo(() => {
    if (cart.length > 0) {
        const firstItem = cart[0];
        if (firstItem.orderType === 'direct' && firstItem.providerId) {
            return `/checkout?type=direct&providerId=${firstItem.providerId}`;
        }
        return `/checkout?type=basic`;
    }
    return '/checkout?type=basic';
  }, [cart]);

  // Handlers
  const handleLogout = () => {
    localStorage.removeItem('posko_token');
    setUserProfile(null);
    setIsLoggedIn(false);
    setIsProfileOpen(false); 
    router.refresh();
  };

  const handleSwitchModeDesktop = async () => {
    if (!userProfile) return;
    setSwitching(true);
    try {
        if (!userProfile.roles.includes('provider')) {
            await registerPartner();
            alert(language === 'id' ? "Selamat! Anda berhasil mendaftar sebagai Mitra." : "Congratulations! You have successfully registered as a Partner.");
        } else {
            await switchRole(userProfile.activeRole === 'provider' ? 'customer' : 'provider');
        }
        window.location.reload();
    } catch (error) {
        const err = error as { response?: { data?: { message?: string } } };
        alert(err.response?.data?.message || (language === 'id' ? "Gagal mengubah mode" : "Failed to switch mode"));
        setSwitching(false);
    }
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement> | React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
          router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      }
  };

  // Loading Screen
  if (isProviderMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-red-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-red-100">
      
      {/* MOBILE HEADER */}
      <div className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-2.5 flex items-center justify-between shadow-sm transition-all">
          <div className="flex items-center gap-2">
            <div className="relative w-6 h-6"><Image src="/logo.png" alt="Posko Logo" fill className="object-contain"/></div>
            <div>
              <h1 className="text-sm font-black text-gray-900 leading-none tracking-tight">POSKO<span className="text-red-600">.</span></h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {isLoggedIn ?  (
               <Link href="/profile">
                 <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 overflow-hidden relative active:scale-95 transition-transform">
                   <Image 
                     src={profileAvatar} 
                     alt="Avatar" 
                     fill 
                     className="object-cover"
                   />
                 </div>
               </Link>
            ) : (
              <Link href="/login" className="text-[10px] font-bold text-gray-900 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors">
                {t('nav.login')}
              </Link>
            )}
          </div>
      </div>

      {/* DESKTOP HEADER */}
      <header className="hidden lg:block sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-10">
              <Link href="/" className="flex items-center gap-2">
                <div className="relative w-8 h-8"><Image src="/logo.png" alt="Posko Logo" fill className="object-contain"/></div>
                <span className="text-xl font-black text-gray-900 tracking-tight">POSKO<span className="text-red-600">.</span></span>
              </Link>
              <nav className="flex gap-6 text-sm font-bold text-gray-600">
                <Link href="/" className="hover:text-red-600 transition-colors text-red-600">{t('nav.home')}</Link>
                <Link href="/search" className="hover:text-red-600 transition-colors">{t('nav.search')}</Link>
                <Link href="/orders" className="hover:text-red-600 transition-colors">{t('nav.orders')}</Link>
              </nav>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative w-64">
                <input 
                    type="text" 
                    placeholder={t('common.search')}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all placeholder:text-gray-400" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                />
                <SearchIcon className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
              </div>

              <LanguageSwitcher />
              
              {isLoggedIn ? (
                 <div className="relative">
                    <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
                        <div className="text-right hidden xl:block"><p className="text-xs font-bold text-gray-900 leading-tight">Halo, {isLoadingProfile ? '...' : profileName.split(' ')[0]}</p></div>
                        <div className="w-8 h-8 bg-gray-100 rounded-full overflow-hidden border border-gray-200 relative">
                          <Image src={profileAvatar} alt="Profile" fill className="object-cover" />
                        </div>
                    </button>
                    {isProfileOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
                                {/* Profile Dropdown Content */}
                                <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-white border border-gray-200 overflow-hidden shrink-0 relative">
                                      <Image src={profileAvatar} alt="Avatar" fill className="object-cover" />
                                    </div>
                                    <div className="min-w-0"><p className="text-sm font-bold text-gray-900 truncate">{isLoadingProfile ? '...' : profileName}</p><p className="text-[10px] text-gray-500 truncate">{profileEmail}</p><span className="inline-block mt-1 px-1.5 py-0.5 bg-red-50 text-red-600 text-[8px] font-bold rounded uppercase tracking-wider border border-red-100">{profileBadge}</span></div>
                                </div>
                                <div className="p-1.5 space-y-0.5">
                                    <Link href="/orders" className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group">
                                        <div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-red-600 group-hover:bg-red-100 transition-colors"><OrderIcon className="w-3.5 h-3.5"/></div><span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">{t('auth.myOrders')}</span></div>
                                    </Link>
                                    <button onClick={handleSwitchModeDesktop} disabled={switching} className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group disabled:opacity-50">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${hasProviderRole ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' : 'bg-green-50 text-green-600 group-hover:bg-green-100'}`}>
                                                {hasProviderRole ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>}
                                            </div>
                                            <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">{switching ? '...' : hasProviderRole ? (isProviderMode ? t('auth.modeCustomer') : t('auth.modePartner')) : t('auth.bePartner')}</span>
                                        </div>
                                    </button>
                                    <div className="h-px bg-gray-100 my-1 mx-2"></div>
                                    <Link href="/profile" className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group">
                                        <div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 group-hover:bg-gray-100 transition-colors"><UserIcon /></div><span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">{t('auth.settings')}</span></div>
                                    </Link>
                                </div>
                                <div className="p-2 bg-gray-50/50 border-t border-gray-100"><button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors">{t('auth.logout')}</button></div>
                            </div>
                        </>
                    )}
                 </div>
              ) : (
                <div className="flex gap-2"><Link href="/login" className="text-xs font-bold text-gray-600 hover:text-gray-900 px-3 py-2">{t('nav.login')}</Link><Link href="/register" className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full shadow-sm transition-all">{t('nav.register')}</Link></div>
              )}
            </div>
          </div>
      </header>

      {/* MOBILE SEARCH BAR */}
      <div className="lg:hidden px-4 py-2 bg-white sticky top-[48px] z-20 border-b border-gray-100 shadow-sm">
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon className="w-4 h-4 text-gray-400 group-focus-within:text-red-500 transition-colors"/></div>
            <input 
                type="text" 
                placeholder={t('home.searchPlaceholder')}
                className="w-full pl-9 pr-4 h-9 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
            />
        </div>
      </div>
      
      {/* BANNER SECTION */}
      <HomeBanner />

      {/* PROMO / VOUCHERS SECTION */}
      <section className="mt-4 px-4 lg:px-8 max-w-7xl mx-auto">
         <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-1.5">
                <span className="text-sm">🔥</span>
                <h2 className="text-sm lg:text-base font-bold text-gray-900">{t('home.promoTitle')}</h2>
             </div>
             <Link href="/vouchers" className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-full transition-colors">{t('common.viewAll')}</Link>
         </div>
         
         <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar snap-x">
             {isLoadingPromos ? (
                [1,2,3].map(i => (
                    <div key={i} className="w-56 h-24 bg-gray-100 rounded-xl animate-pulse shrink-0"></div>
                ))
             ) : promos.length > 0 ? (
                 promos.slice(0, 5).map((promo, idx) => (
                    <PromoCard 
                        key={promo._id} 
                        voucher={promo}
                        index={idx}
                    />
                 ))
             ) : (
                <div className="w-full py-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
                    <p className="text-gray-400 text-[10px]">{t('home.noPromo')}</p>
                </div>
             )}
         </div>
      </section>

      {/* CATEGORIES */}
      <ServiceCategories categories={categories} isLoading={isLoadingServices} />

      {/* BECOME PARTNER SECTION */}
      <BecomePartnerSection />

      {/* TECHNICIANS NEARBY */}
      <TechnicianSection 
        userLocation={userProfile?.location ? { lat: userProfile.location.coordinates[1], lng: userProfile.location.coordinates[0] } : undefined}
      />
      
      {/* SECTION KEUNGGULAN (MINIMALIST STRIP) */}
      <section className="px-4 lg:px-8 mt-3 mb-6 lg:mt-6 lg:mb-10 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 py-3 px-2 lg:py-5 lg:px-6">
            <div className="grid grid-cols-3 gap-1 divide-x divide-gray-100">
                
                {/* Verified */}
                <div className="flex flex-col items-center justify-center text-center px-1">
                    <div className="w-7 h-7 lg:w-9 lg:h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-1.5">
                        <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h3 className="text-[10px] lg:text-xs font-bold text-gray-900 leading-none">{t('home.whyVerified')}</h3>
                    <p className="text-[8px] lg:text-[10px] text-gray-400 mt-1 leading-none hidden lg:block">{t('home.whyVerifiedDesc')}</p>
                </div>

                {/* Price */}
                <div className="flex flex-col items-center justify-center text-center px-1">
                    <div className="w-7 h-7 lg:w-9 lg:h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
                        <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h3 className="text-[10px] lg:text-xs font-bold text-gray-900 leading-none">{t('home.whyPrice')}</h3>
                    <p className="text-[8px] lg:text-[10px] text-gray-400 mt-1 leading-none hidden lg:block">{t('home.whyPriceDesc')}</p>
                </div>

                {/* Fast */}
                <div className="flex flex-col items-center justify-center text-center px-1">
                    <div className="w-7 h-7 lg:w-9 lg:h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-1.5">
                        <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <h3 className="text-[10px] lg:text-xs font-bold text-gray-900 leading-none">{t('home.whyFast')}</h3>
                    <p className="text-[8px] lg:text-[10px] text-gray-400 mt-1 leading-none hidden lg:block">{t('home.whyFastDesc')}</p>
                </div>

            </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />

      {/* FLOATING CHAT */}
      {isLoggedIn && userProfile && (
        <div className="hidden lg:block">
            <ChatWidget user={userProfile} />
        </div>
      )}

      {/* FLOATING CART */}
      {totalItems > 0 && (
          <Link href={checkoutUrl} className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-50 flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-full shadow-lg shadow-red-600/30 hover:shadow-xl hover:scale-105 transition-all duration-300 animate-fadeIn">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <span className="font-bold text-xs">{totalItems} • {formatCurrency(totalAmount)}</span>
          </Link>
      )}
    </main>
  );
}

// Promo Card Component
function PromoCard({ voucher, index }: { voucher: Voucher, index: number }) {
  const { language } = useLanguage();
  const colors = ['from-red-500 to-orange-500', 'from-blue-500 to-indigo-500', 'from-emerald-500 to-teal-500', 'from-purple-500 to-pink-500'];
  const bgClass = colors[index % colors.length];

  const discountText = voucher.discountType === 'percentage' 
    ? `${voucher.discountValue}% OFF` 
    : `${language === 'id' ? 'Hemat' : 'Save'} ${new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', { compactDisplay: "short", notation: "compact" }).format(voucher.discountValue)}`;

  return (
    <div className={`w-56 h-24 rounded-lg p-3 flex flex-row items-center justify-between text-white shadow-sm relative overflow-hidden shrink-0 group cursor-pointer snap-start transition-all hover:shadow-md ${!voucher.imageUrl ? `bg-gradient-to-r ${bgClass}` : 'bg-gray-900'}`}>
      
      {voucher.imageUrl ? (
        <>
          <Image 
            src={voucher.imageUrl}
            alt={voucher.code}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, 300px"
          />
          <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-colors"></div>
        </>
      ) : (
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all"></div>
      )}

      <div className="flex flex-col justify-between h-full z-10 max-w-[70%]">
         <span className="text-[10px] font-medium opacity-90 truncate bg-black/20 px-1.5 py-0.5 rounded w-fit backdrop-blur-sm border border-white/10">
            {voucher.code}
         </span>
         <h3 className="font-black text-lg leading-none tracking-tight drop-shadow-sm">{discountText}</h3>
         <p className="text-[9px] opacity-90 truncate max-w-full font-medium text-gray-100">
            Min. {new Intl.NumberFormat('id-ID').format(voucher.minPurchase)}
         </p>
      </div>

      <div className="flex flex-col items-end justify-between h-full z-10">
         <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] backdrop-blur-md border border-white/20">🏷️</div>
         {voucher.isClaimed ? (
             <span className="text-[9px] font-bold bg-white/90 text-gray-500 px-2 py-0.5 rounded shadow-sm">
                {language === 'id' ? 'Klaim' : 'Claimed'}
             </span>
         ) : (
             <Link href="/vouchers" className="text-[9px] font-bold bg-white text-gray-900 px-2.5 py-1 rounded shadow-sm hover:bg-gray-100 transition-colors">
                {language === 'id' ? 'Ambil' : 'Get'}
             </Link>
         )}
      </div>
    </div>
  )
}