// src/app/page.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { fetchServices } from '@/features/services/api';
import { fetchProviders } from '@/features/providers/api';
import { fetchProfile, switchRole, registerPartner } from '@/features/auth/api';
import { useCart } from '@/features/cart/useCart';
import type { User, Service, Provider } from '@/features/auth/types';

import ServiceCategories from '@/components/home/ServiceCategories';
import ChatWidget from '@/components/ChatWidget';

export default function HomePage() {
  const router = useRouter();
  const { totalItems, totalAmount, cart } = useCart();

  // State untuk Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // State untuk Data
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  
  // Memoize profile-related computed values
  const profileName = useMemo(() => 
    userProfile?.fullName || 'User Posko', 
    [userProfile?.fullName]
  );
  
  const profileEmail = useMemo(() => 
    userProfile?.email || '-', 
    [userProfile?.email]
  );
  
  const profileBadge = useMemo(() => 
    userProfile?.activeRole 
      ? userProfile.activeRole.charAt(0).toUpperCase() + userProfile.activeRole.slice(1) 
      : 'Member', 
    [userProfile?.activeRole]
  );
  
  const profileAvatar = useMemo(() => 
    userProfile?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profileName)}`,
    [userProfile?.profilePictureUrl, profileName]
  );
  
  const isProviderMode = useMemo(() => 
    userProfile?.activeRole === 'provider',
    [userProfile?.activeRole]
  );
  
  const hasProviderRole = useMemo(() => 
    userProfile?.roles.includes('provider'),
    [userProfile?.roles]
  );

  // =====================================================================
  // EFFECT 1: Fetch Services (Independent)
  // =====================================================================
  useEffect(() => {
    const loadServices = async () => {
      try {
        setIsLoadingServices(true);
        const res = await fetchServices();
        // PERBAIKAN: Pastikan res.data adalah array
        const servicesArray = Array.isArray(res.data) ? res.data : [];
        setServices(servicesArray);
      } catch (err) {
        console.error('Gagal memuat layanan:', err);
        setServices([]);
      } finally {
        setIsLoadingServices(false);
      }
    };

    loadServices();
  }, []);

  // =====================================================================
  // EFFECT 2: Fetch Providers (Independent)
  // =====================================================================
  useEffect(() => {
    const loadProviders = async () => {
      try {
        setIsLoadingProviders(true);
        const res = await fetchProviders({});
        setProviders(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Gagal memuat mitra:', err);
        setProviders([]);
      } finally {
        setIsLoadingProviders(false);
      }
    };

    loadProviders();
  }, []);

  // =====================================================================
  // EFFECT 3: Fetch User Profile (Depends on Auth Token)
  // =====================================================================
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const token = localStorage.getItem('posko_token');
        
        if (token) {
          setIsLoggedIn(true);
          const res = await fetchProfile();
          setUserProfile(res.data.profile);
        } else {
          setIsLoggedIn(false);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        localStorage.removeItem('posko_token');
        localStorage.removeItem('posko_refresh_token');
        localStorage.removeItem('userId');
        setIsLoggedIn(false);
        setUserProfile(null);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  // =====================================================================
  // EFFECT 4: Re-fetch Profile ketika Token Berubah
  // =====================================================================
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'posko_token') {
        if (event.newValue) {
          fetchProfile()
            .then(res => setUserProfile(res.data.profile))
            .catch(() => {
              setIsLoggedIn(false);
              setUserProfile(null);
            });
        } else {
          setIsLoggedIn(false);
          setUserProfile(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // =====================================================================
  // MEMOIZED VALUES
  // =====================================================================
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

  // =====================================================================
  // HANDLERS
  // =====================================================================
  const handleLogout = () => {
    localStorage.removeItem('posko_token');
    localStorage.removeItem('posko_refresh_token');
    localStorage.removeItem('userId');
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
        alert('Selamat! Anda berhasil mendaftar sebagai Mitra.');
      } else {
        await switchRole(userProfile.activeRole === 'provider' ? 'customer' : 'provider');
      }
      window.location.reload();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        : undefined;
      alert(errorMessage || 'Gagal mengubah mode');
      setSwitching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
              <span className="text-white font-black text-lg">P</span>
            </div>
            <span className="hidden lg:inline font-bold text-gray-900">Posko</span>
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right Section */}
          <div className="flex items-center gap-3 lg:gap-6">
            {/* Cart Button */}
            <Link
              href={checkoutUrl}
              className="relative p-2 lg:p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Auth Section */}
            {isLoadingProfile ? (
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
            ) : isLoggedIn && userProfile ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Image
                    src={profileAvatar}
                    alt={profileName}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="hidden lg:inline font-semibold text-sm text-gray-900">{profileName.split(' ')[0]}</span>
                </button>

                {isProfileOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 space-y-3">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                      <Image
                        src={profileAvatar}
                        alt={profileName}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">{profileName}</p>
                        <p className="text-xs text-gray-500 truncate">{profileEmail}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">
                          {profileBadge}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleSwitchModeDesktop}
                      disabled={switching}
                      className="w-full px-4 py-2 text-sm font-bold text-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {switching ? 'Mengubah mode...' : isProviderMode ? 'Ganti ke Customer' : 'Daftar Mitra'}
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-sm font-bold text-center bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Login
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4 py-8">
          <h1 className="text-3xl lg:text-5xl font-black text-gray-900">
            Temukan Jasa Profesional <span className="text-red-600">Terdekat</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Layanan terpercaya dari para profesional bersertifikat di sekitar Anda
          </p>
        </section>

        {/* Services Section */}
        <ServiceCategories isLoading={isLoadingServices} categories={categories} />

        {/* Providers Carousel */}
        {isLoadingProviders ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin"></div>
          </div>
        ) : providers.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Mitra Terpercaya</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.slice(0, 6).map((provider) => (
                <Link
                  key={provider._id}
                  href={`/provider/${provider._id}`}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-red-200 transition-all duration-300"
                >
                  <div className="p-6 space-y-4">
                    <Image
                      src={provider.userId.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider.userId.fullName}`}
                      alt={provider.userId.fullName}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover mx-auto group-hover:scale-110 transition-transform"
                    />
                    <div className="text-center">
                      <h3 className="font-bold text-gray-900">{provider.userId.fullName}</h3>
                      <div className="flex items-center justify-center gap-1 mt-2">
                        <span className="text-sm text-yellow-500">★</span>
                        <span className="text-sm font-bold text-gray-700">{provider.rating ? provider.rating.toFixed(1) : 'New'}</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-2">{provider.userId.bio}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      {/* Floating Cart Button */}
      <Link
        href={checkoutUrl}
        className="fixed bottom-24 left-4 lg:bottom-8 lg:left-8 z-50 flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-full shadow-xl shadow-red-300 hover:bg-red-700 hover:scale-105 transition-all duration-300"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1h7.586a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM5 16a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className="font-bold">{totalAmount > 0 ? `Rp ${(totalAmount / 1000000).toFixed(1)}jt` : 'Keranjang'}</span>
      </Link>

      {/* Chat Widget */}
      {isLoggedIn && userProfile && (
        <ChatWidget 
          user={{
            _id: userProfile._id,
            userId: userProfile._id,
            fullName: userProfile.fullName,
            profilePictureUrl: userProfile.profilePictureUrl,
          }} 
        />
      )}
    </div>
  );
}
          