// src/app/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { fetchProfile, switchRole, registerPartner } from '@/features/auth/api';
import { User } from '@/features/auth/types';
import { fetchServices } from '@/features/services/api';
import { fetchProviders } from '@/features/providers/api'; 
import { Service } from '@/features/services/types';
import { Provider } from '@/features/providers/types'; 
import { useCart } from '@/features/cart/useCart';

// --- KOMPONEN MODULAR ---
import ProviderHome from '@/components/ProviderHome';
import TechnicianSection from '@/components/home/TechnicianSection';
import ServiceCategories from '@/components/home/ServiceCategories';
import ChatWidget from '@/components/ChatWidget'; // [1] IMPORT WIDGET CHAT

// --- ICONS ---
const SearchIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;
const HomeIcon = ({ active }: { active?: boolean }) => <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>;
const OrderIcon = ({ className = "w-6 h-6" }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>;
const ChatIcon = ({ className = "w-6 h-6" }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>;
const UserIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>;

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
  const [providers, setProviders] = useState<Provider[]>([]); 
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  
  // Helpers
  const profileName = userProfile?.fullName || 'User Posko';
  const profileEmail = userProfile?.email || '-';
  const profileBadge = userProfile?.activeRole ? userProfile.activeRole.charAt(0).toUpperCase() + userProfile.activeRole.slice(1) : 'Member';
  const profileAvatar = userProfile?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profileName)}`;
  const isProviderMode = userProfile?.activeRole === 'provider';
  const hasProviderRole = userProfile?.roles.includes('provider');

  // Fetching Data
  useEffect(() => {
    // 1. Fetch Services
    fetchServices()
      .then(res => setServices(res.data || []))
      .catch(console.error)
      .finally(() => setIsLoadingServices(false));

    // 2. Fetch Providers
    fetchProviders({})
      .then(res => setProviders(Array.isArray(res.data) ? res.data : []))
      .catch(err => {
        console.error("Gagal memuat mitra:", err);
        setProviders([]);
      })
      .finally(() => setIsLoadingProviders(false));
    
    // 3. Fetch User Profile
    const token = localStorage.getItem('posko_token');
    setIsLoggedIn(!!token);
    if (token) {
      fetchProfile()
        .then(res => setUserProfile(res.data.profile))
        .catch(() => { localStorage.removeItem('posko_token'); setIsLoggedIn(false); })
        .finally(() => setIsLoadingProfile(false));
    } else {
      setIsLoadingProfile(false);
    }
  }, []);

  const groupServicesToCategories = (services: Service[]) => {
    const categoriesMap = new Map();
    services.forEach(service => {
        if (!categoriesMap.has(service.category)) {
            categoriesMap.set(service.category, {
                name: service.category,
                slug: encodeURIComponent(service.category.replace(/\s+/g, '-')),
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
            return `/checkout?type=direct&providerId=${firstItem.providerId}`;
        }
        return `/checkout?type=basic`;
    }
    return '/checkout?type=basic';
  }, [cart]);

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
            alert("Selamat! Anda berhasil mendaftar sebagai Mitra.");
        } else {
            await switchRole(userProfile.activeRole === 'provider' ? 'customer' : 'provider');
        }
        window.location.reload();
    } catch (error: any) {
        alert(error.response?.data?.message || "Gagal mengubah mode");
        setSwitching(false);
    }
  };

  if (isProviderMode && userProfile) {
    return <ProviderHome user={userProfile} />;
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-red-100">
      
      {/* HEADER (Mobile & Desktop) */}
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8"><Image src="/logo.png" alt="Posko Logo" fill className="object-contain"/></div>
            <div><h1 className="text-base font-bold text-gray-900 leading-none">POSKO</h1><p className="text-[10px] text-red-500 font-medium mt-0.5">Marketplace Jasa #1 di Indonesia</p></div>
          </div>
          <div>
            {isLoggedIn ? (
               <Link href="/profile"><div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 overflow-hidden"><img src={profileAvatar} alt="Avatar" className="w-full h-full object-cover"/></div></Link>
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
                <input type="text" placeholder="Cari layanan atau teknisi..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all" />
                <SearchIcon className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              </div>
              
              {isLoggedIn ? (
                 <div className="relative">
                    <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group">
                        <div className="text-right hidden xl:block"><p className="text-xs font-bold text-gray-900">Halo, {isLoadingProfile ? 'Memuat...' : profileName}</p><p className="text-[10px] text-gray-500 font-medium">{isLoadingProfile ? '...' : profileBadge}</p></div>
                        <div className="w-9 h-9 bg-gray-100 rounded-full overflow-hidden border border-gray-200"><img src={profileAvatar} alt="Profile" className="w-full h-full object-cover" /></div>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                    </button>
                    {/* DROPDOWN DESKTOP */}
                    {isProfileOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
                                <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 overflow-hidden shrink-0"><img src={profileAvatar} alt="Avatar" className="w-full h-full object-cover"/></div>
                                    <div className="min-w-0"><p className="text-sm font-bold text-gray-900 truncate">{isLoadingProfile ? '...' : profileName}</p><p className="text-[11px] text-gray-500 truncate">{isLoadingProfile ? '...' : profileEmail}</p></div>
                                </div>
                                <div className="p-2 space-y-1">
                                    <Link href="/orders" className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                                        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 group-hover:bg-red-100"><OrderIcon className="w-4 h-4" /></div><span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Daftar Pesanan</span></div>
                                    </Link>
                                    <button onClick={handleSwitchModeDesktop} disabled={switching} className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors text-left group">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${hasProviderRole ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' : 'bg-green-50 text-green-600 group-hover:bg-green-100'}`}>
                                                {hasProviderRole ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{switching ? 'Memproses...' : hasProviderRole ? (isProviderMode ? 'Mode Customer' : 'Mode Provider') : 'Daftar Jadi Mitra'}</span>
                                        </div>
                                    </button>
                                    <div className="h-px bg-gray-100 my-1 mx-3"></div>
                                    <Link href="/profile" className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                                        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 group-hover:bg-gray-200"><UserIcon /></div><span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Pengaturan Akun</span></div>
                                    </Link>
                                </div>
                                <div className="p-3 bg-gray-50/50 border-t border-gray-100"><button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 bg-white border border-red-100 hover:bg-red-50 rounded-xl transition-colors shadow-sm">Keluar Aplikasi</button></div>
                            </div>
                        </>
                    )}
                 </div>
              ) : (
                <div className="flex gap-3"><Link href="/login" className="text-sm font-bold text-gray-600 hover:text-gray-900 px-4 py-2">Masuk</Link><Link href="/register" className="text-sm font-bold text-white bg-red-600 hover:bg-red-700 px-5 py-2 rounded-full shadow-lg shadow-red-200 transition-all hover:-translate-y-0.5">Daftar</Link></div>
              )}
            </div>
          </div>
      </header>

      {/* HERO SECTION & SERVICE CATEGORIES & TECHNICIAN SECTION */}
      <section className="lg:hidden px-4 pt-6 pb-2">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2 leading-tight">Cari jasa apa <br/><span className="text-red-600 relative">sekarang?<svg className="absolute w-full h-2 -bottom-1 left-0 text-red-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" /></svg></span></h2>
        <p className="text-xs text-gray-500 mb-6 max-w-[280px]">Hubungkan dengan ratusan teknisi terverifikasi di sekitar Anda.</p>
        <div className="relative group"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><SearchIcon className="w-5 h-5 text-gray-400 group-focus-within:text-red-500" /></div><input type="text" placeholder="Coba cari 'Servis AC'..." className="block w-full pl-11 pr-4 py-3.5 border-none rounded-2xl bg-white text-sm text-gray-900 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] ring-1 ring-gray-100 focus:ring-2 focus:ring-red-500 focus:outline-none" /></div>
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
            <h1 className="text-5xl font-black text-gray-900 leading-[1.15] mb-6">Solusi Jasa Profesional <br/>di <span className="text-red-600 relative inline-block">Ujung Jari<svg className="absolute w-full h-3 -bottom-1 left-0 text-red-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" /></svg></span></h1>
            <p className="text-lg text-gray-500 mb-8 max-w-lg leading-relaxed">Temukan teknisi AC, montir, hingga layanan kebersihan terbaik di sekitar Anda dengan harga transparan dan garansi layanan.</p>
            <div className="flex gap-4"><button className="bg-red-600 text-white font-bold px-8 py-3.5 rounded-xl shadow-xl shadow-red-200 hover:bg-red-700 transition-transform hover:-translate-y-1">Cari Jasa Sekarang</button><button className="bg-white text-gray-700 font-bold px-8 py-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">Gabung Mitra</button></div>
            </div>
            <div className="relative h-96 w-full rounded-3xl bg-gray-100 border border-gray-200 overflow-hidden group shadow-xl">
                <Image src="https://drive.google.com/uc?export=view&id=1izUc0As5ae1dFrNaiZcWGqDn28nSRnsY" alt="Ilustrasi Teknisi" fill className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105" priority sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
            </div>
        </div>
      </section>

      <ServiceCategories categories={categories} isLoading={isLoadingServices} />

      <TechnicianSection 
        providers={providers} 
        isLoading={isLoadingProviders} 
        userLocation={userProfile?.location} 
      />
      
      <footer className="bg-gray-50 border-t border-gray-200 py-12 text-center pb-24 lg:pb-12"><p className="text-gray-400 font-medium">© 2024 Posko Services. All rights reserved.</p></footer>

      {/* [2] FLOATING CHAT REAL-TIME (DESKTOP ONLY) */}
      {isLoggedIn && userProfile && (
        <div className="hidden lg:block">
            <ChatWidget user={userProfile} />
        </div>
      )}

      {/* MOBILE BOTTOM NAV */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 pb-5 pt-2 px-4 bg-gradient-to-t from-white via-white/90 to-transparent z-40">
          <nav className="bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-2xl px-6 py-3.5 flex justify-between items-center">
            <NavItem icon={<HomeIcon active={!isProviderMode} />} active={!isProviderMode} />
            <Link href="/orders" className="flex flex-col items-center justify-center gap-1 w-12 text-gray-400 hover:text-red-600 transition-colors">
                <OrderIcon />
            </Link>
            <Link href="/chat" className="flex flex-col items-center justify-center gap-1 w-12 text-gray-400 hover:text-red-600 transition-colors">
                <ChatIcon />
            </Link>
            <Link href="/profile" className="flex flex-col items-center justify-center gap-1 w-12 text-gray-400 hover:text-red-600 transition-colors"><UserIcon /></Link>
          </nav>
      </div>

      {/* FLOATING CART */}
      {totalItems > 0 && (
          <Link href={checkoutUrl} className="fixed bottom-24 left-4 lg:bottom-8 lg:left-8 z-50 flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-full shadow-xl shadow-red-300 hover:bg-red-700 hover:scale-105 transition-all duration-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <span className="font-bold text-sm">{totalItems} Unit | {formatCurrency(totalAmount)}</span>
          </Link>
      )}
    </main>
  );
}

function PromoCardMobile({ color, title, subtitle, btn }: { color: 'red'|'dark', title: string, subtitle: string, btn: string }) {
  const bgClass = color === 'red' ? 'bg-gradient-to-br from-red-600 to-orange-600 shadow-red-200' : 'bg-gray-900 shadow-gray-200';
  return (
    <div className={`w-[280px] h-36 rounded-2xl ${bgClass} p-5 flex flex-col justify-between text-white shadow-lg relative overflow-hidden shrink-0`}>
      <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
      <div><span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase ${color === 'red' ? 'bg-white/20' : 'bg-red-600'}`}>Promo</span><h3 className="font-bold text-xl mt-2 leading-tight">{title} <br/>{subtitle}</h3></div>
      <button className={`w-fit text-[10px] font-bold px-3 py-1.5 rounded-full ${color === 'red' ? 'bg-white text-red-600' : 'bg-white/10 border border-white/20'}`}>{btn}</button>
    </div>
  )
}

function NavItem({ icon, active = false }: { icon: React.ReactNode; active?: boolean }) {
  return (
    <button className={`flex flex-col items-center justify-center gap-1 w-12 ${active ? 'text-red-600' : 'text-gray-400'} transition-colors`}><div className="relative">{icon}{active && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-600 rounded-full border-2 border-white"></span>}</div></button>
  );
}