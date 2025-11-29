// src/app/(customer)/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { fetchProfile, switchRole, registerPartner } from '@/features/auth/api';
import { User } from '@/features/auth/types';
import { fetchServices } from '@/features/services/api';
import { Service } from '@/features/services/types';
import { useCart } from '@/features/cart/useCart';

// --- KOMPONEN MODULAR ---
import ProviderHome from '@/components/ProviderHome';
import TechnicianSection from '@/components/home/TechnicianSection';
import ServiceCategories from '@/components/home/ServiceCategories';
import ChatWidget from '@/components/ChatWidget';

// --- ICONS ---
const SearchIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const OrderIcon = ({ className = "w-6 h-6" }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
const UserIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

export default function HomePage() {
  const router = useRouter();
  const { totalItems, totalAmount, cart } = useCart(); 

  // State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Data State
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  
  // Helpers
  const profileName = userProfile?.fullName || 'User Posko';
  const profileEmail = userProfile?.email || '-';
  const profileBadge = userProfile?.activeRole ?   userProfile.activeRole.charAt(0).toUpperCase() + userProfile.activeRole.slice(1) : 'Member';
  const profileAvatar = userProfile?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profileName)}`;
  const isProviderMode = userProfile?.activeRole === 'provider';
  const hasProviderRole = userProfile?.roles.includes('provider');

  // Fetching Data: Services (Independent Effect)
  useEffect(() => {
    // FIX: Removed unnecessary setIsLoadingServices(true) since initial state is true
    fetchServices()
      .then(res => setServices(res.data || []))
      .catch(err => console.error("Gagal memuat layanan:", err))
      .finally(() => setIsLoadingServices(false));
  }, []);

  // Fetching Data: User Profile (Independent Effect)
  useEffect(() => {
    const token = localStorage.getItem('posko_token');
    
    // FIX: Only set login state if it differs to avoid redundant updates
    if (!!token !== isLoggedIn) {
      setIsLoggedIn(!!token);
    }
    
    if (token) {
      // FIX: Removed unnecessary setIsLoadingProfile(true) since initial state is true
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

  const checkoutUrl = useMemo(() => {
    if (cart.length > 0) {
        const firstItem = cart[0];
        if (firstItem.orderType === 'direct' && firstItem.providerId) {
            return `/checkout? type=direct&providerId=${firstItem.providerId}`;
        }
        return `/checkout?type=basic`;
    }
    return '/checkout? type=basic';
  }, [cart]);

  const handleLogout = () => {
    localStorage.removeItem('posko_token');
    setUserProfile(null);
    setIsLoggedIn(false);
    setIsProfileOpen(false); 
    router.refresh();
  };

  const handleSwitchModeDesktop = async () => {
    if (! userProfile) return;
    setSwitching(true);
    try {
        if (! userProfile.roles.includes('provider')) {
            await registerPartner();
            alert("Selamat!  Anda berhasil mendaftar sebagai Mitra.");
        } else {
            await switchRole(userProfile.activeRole === 'provider' ? 'customer' : 'provider');
        }
        window.location.reload();
    } catch (error) {
        // FIX: Type assertion for error
        const err = error as { response?: { data?: { message?: string } } };
        alert(err.response?.data?.message || "Gagal mengubah mode");
        setSwitching(false);
    }
  };

  if (isProviderMode && userProfile) {
    return <ProviderHome user={userProfile} />;
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-red-100">
      
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8"><Image src="/logo.png" alt="Posko Logo" fill className="object-contain"/></div>
            <div><h1 className="text-base font-bold text-gray-900 leading-none">POSKO</h1><p className="text-[10px] text-red-500 font-medium mt-0.5">Marketplace Jasa #1 di Indonesia</p></div>
          </div>
          <div>
            {isLoggedIn ?  (
               <Link href="/profile">
                 <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 overflow-hidden relative">
                   {/* FIX: Use Next Image instead of img */}
                   <Image 
                     src={profileAvatar} 
                     alt="Avatar" 
                     fill 
                     className="object-cover"
                   />
                 </div>
               </Link>
            ) : (
              <Link href="/login" className="text-[11px] font-bold text-white bg-gray-900 px-4 py-2 rounded-full shadow-md">Masuk</Link>
            )}
          </div>
      </div>

      {/* Desktop Header */}
      <header className="hidden lg:block sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-10">
              <Link href="/" className="flex items-center gap-3">
                <div className="relative w-10 h-10"><Image src="/logo.png" alt="Posko Logo" fill className="object-contain"/></div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">POSKO<span className="text-red-600">.</span></span>
              </Link>
              <nav className="flex gap-8 text-sm font-bold text-gray-600">
                <Link href="/" className="hover:text-red-600 transition-colors">Beranda</Link>
                <Link href="#" className="hover:text-red-600 transition-colors">Jasa</Link>
                <Link href="#" className="hover:text-red-600 transition-colors">Mitra</Link>
                {isLoggedIn && <Link href="/orders" className="hover:text-red-600 transition-colors">Pesanan</Link>}
              </nav>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative w-72">
                <input type="text" placeholder="Cari layanan atau teknisi..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all" />
                <SearchIcon className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              </div>
              
              {isLoggedIn ? (
                 <div className="relative">
                    <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
                        <div className="text-right hidden xl:block"><p className="text-xs font-bold text-gray-900">Halo, {isLoadingProfile ? 'Memuat...' : profileName}</p><p className="text-[10px] text-gray-500 truncate max-w-[120px]">{profileEmail}</p></div>
                        <div className="w-9 h-9 bg-gray-100 rounded-full overflow-hidden border border-gray-200 relative">
                          {/* FIX: Use Next Image */}
                          <Image 
                            src={profileAvatar} 
                            alt="Profile" 
                            fill
                            className="object-cover" 
                          />
                        </div>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isProfileOpen ?  'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {/* DROPDOWN DESKTOP */}
                    {isProfileOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
                                <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 overflow-hidden shrink-0 relative">
                                      {/* FIX: Use Next Image */}
                                      <Image 
                                        src={profileAvatar} 
                                        alt="Avatar" 
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0"><p className="text-sm font-bold text-gray-900 truncate">{isLoadingProfile ? '...' : profileName}</p><p className="text-[11px] text-gray-500 truncate">{profileEmail}</p><span className="inline-block mt-1 px-2 py-0.5 bg-red-50 text-red-600 text-[9px] font-bold rounded-full border border-red-100">{profileBadge}</span></div>
                                </div>
                                <div className="p-2 space-y-1">
                                    <Link href="/orders" className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                                        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 group-hover:bg-red-100 transition-colors"><OrderIcon className="w-4 h-4"/></div><span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Pesanan Saya</span></div>
                                    </Link>
                                    <button onClick={handleSwitchModeDesktop} disabled={switching} className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group disabled:opacity-50">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${hasProviderRole ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' : 'bg-green-50 text-green-600 group-hover:bg-green-100'}`}>
                                                {hasProviderRole ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{switching ? 'Memproses...' : hasProviderRole ? (isProviderMode ? 'Mode Customer' : 'Mode Mitra') : 'Daftar Mitra'}</span>
                                        </div>
                                    </button>
                                    <div className="h-px bg-gray-100 my-1 mx-3"></div>
                                    <Link href="/profile" className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                                        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 group-hover:bg-gray-100 transition-colors"><UserIcon /></div><span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Pengaturan</span></div>
                                    </Link>
                                </div>
                                <div className="p-3 bg-gray-50/50 border-t border-gray-100"><button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors">Keluar</button></div>
                            </div>
                        </>
                    )}
                 </div>
              ) : (
                <div className="flex gap-3"><Link href="/login" className="text-sm font-bold text-gray-600 hover:text-gray-900 px-4 py-2">Masuk</Link><Link href="/register" className="text-sm font-bold text-white bg-red-600 hover:bg-red-700 px-6 py-2 rounded-full shadow-md transition-all">Daftar</Link></div>
              )}
            </div>
          </div>
      </header>

      {/* HERO SECTION */}
      <section className="lg:hidden px-4 pt-6 pb-2">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2 leading-tight">Cari jasa apa <br/><span className="text-red-600 relative">sekarang?  <svg className="absolute w-full h-2 -bottom-1 left-0" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0,5 Q25,0 50,5 T100,5" stroke="currentColor" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke"/></svg></span></h2>
        <p className="text-xs text-gray-500 mb-6 max-w-[280px]">Hubungkan dengan ratusan teknisi terverifikasi di sekitar Anda.</p>
        <div className="relative group"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><SearchIcon className="w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors"/></div><input type="text" placeholder="Cari layanan, teknisi, atau kategori..." className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-2xl text-sm font-medium placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all shadow-sm" /></div>
      </section>
      
      <section className="lg:hidden mt-4 pl-4 overflow-x-auto no-scrollbar flex gap-3 pr-4">
        <PromoCardMobile color="red" title="Diskon 50%" subtitle="Pengguna Baru" btn="Klaim" /> 
        <PromoCardMobile color="dark" title="Garansi Puas" subtitle="Uang Kembali" btn="Cek Syarat" /> 
      </section>
      
      <section className="hidden lg:block relative bg-white border-b border-gray-100 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-red-50/50 -skew-x-12 translate-x-20"></div>
        <div className="max-w-7xl mx-auto px-8 py-20 grid grid-cols-2 items-center relative z-10">
            <div>
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold mb-6 border border-red-100"><span>🚀</span> Marketplace Jasa #1 di Indonesia</div>
            <h1 className="text-5xl font-black text-gray-900 leading-[1.15] mb-6">Solusi Jasa Profesional <br/>di <span className="text-red-600 relative inline-block">Ujung Jari<svg className="absolute w-full h-3 -bottom-1 left-0" viewBox="0 0 200 10" preserveAspectRatio="none"><path d="M0,7 Q50,0 100,7 T200,7" stroke="currentColor" strokeWidth="3" fill="none"/></svg></span></h1>
            <p className="text-lg text-gray-500 mb-8 max-w-lg leading-relaxed">Temukan teknisi AC, montir, hingga layanan kebersihan terbaik di sekitar Anda dengan harga transparan dan garansi layanan.</p>
            <div className="flex gap-4"><button className="bg-red-600 text-white font-bold px-8 py-3.5 rounded-xl shadow-xl shadow-red-200 hover:bg-red-700 transition-transform hover:-translate-y-0.5">Mulai Cari Jasa</button><button className="border-2 border-gray-200 text-gray-700 font-bold px-8 py-3.5 rounded-xl hover:border-gray-300 hover:shadow-md transition-all">Jadi Mitra</button></div>
            </div>
            <div className="relative h-96 w-full rounded-3xl bg-gray-100 border border-gray-200 overflow-hidden group shadow-xl">
                <Image src="https://drive.google.com/uc? export=view&id=1izUc0As5ae1dFrNaiZcWGqDn28nSRnsY" alt="Ilustrasi Teknisi" fill className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
            </div>
        </div>
      </section>

      <ServiceCategories categories={categories} isLoading={isLoadingServices} />

      <TechnicianSection 
        userLocation={userProfile?.location ?  { lat: userProfile.location.coordinates[1], lng: userProfile.location.coordinates[0] } : undefined}
      />
      
      <footer className="bg-gray-50 border-t border-gray-200 py-12 text-center pb-24 lg:pb-12"><p className="text-gray-400 font-medium">© 2024 Posko Services.All rights reserved.</p></footer>

      {/* FLOATING CHAT REAL-TIME (DESKTOP ONLY) */}
      {isLoggedIn && userProfile && (
        <div className="hidden lg:block">
            <ChatWidget user={userProfile} />
        </div>
      )}

      {/* FLOATING CART */}
      {totalItems > 0 && (
          <Link href={checkoutUrl} className="fixed bottom-24 left-4 lg:bottom-8 lg:left-8 z-50 flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-full shadow-xl shadow-red-300 hover:shadow-2xl hover:shadow-red-400 hover:scale-105 transition-all duration-300 animate-bounce-slow">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <span className="font-bold text-sm">{totalItems} Unit | {formatCurrency(totalAmount)}</span>
          </Link>
      )}
    </main>
  );
}

function PromoCardMobile({ color, title, subtitle, btn }: { color: 'red'|'dark', title: string, subtitle: string, btn: string }) {
  const bgClass = color === 'red' ?  'bg-gradient-to-br from-red-600 to-orange-600 shadow-red-200' : 'bg-gray-900 shadow-gray-200';
  return (
    <div className={`w-[280px] h-36 rounded-2xl ${bgClass} p-5 flex flex-col justify-between text-white shadow-lg relative overflow-hidden shrink-0`}>
      <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
      <div><span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase ${color === 'red' ?  'bg-white/20' : 'bg-red-600'}`}>Promo</span><h3 className="font-bold text-xl mt-2">{title}</h3><p className="text-xs opacity-90">{subtitle}</p></div>
      <button className={`w-fit text-[10px] font-bold px-3 py-1.5 rounded-full ${color === 'red' ? 'bg-white text-red-600' : 'bg-white/10 border border-white/20'}`}>{btn}</button>
    </div>
  )
}