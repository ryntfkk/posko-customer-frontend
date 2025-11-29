// src/app/provider/[providerId]/page.tsx
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { fetchProviderById } from '@/features/providers/api';
import { fetchProfile } from '@/features/auth/api';
import { Provider } from '@/features/providers/types';
import { User } from '@/features/auth/types';

// Import semua komponen dari folder components
import {
  calculateDistance,
  TabType,
  ServiceItem,
  BackIcon,
  ProviderLoading,
  ProviderNotFound,
  ProviderHeroSection,
  ProviderTabSection,
  ProviderSidebar,
  ProviderCalendarModal,
  ProviderServiceDetailModal,
  ProviderImageLightbox,
  ProviderStickyBottomCTA,
} from '@/features/providers/components';

export default function ProviderProfilePage() {
  const params = useParams();
  const providerId = Array.isArray(params.providerId) ? params.providerId[0] : params.providerId;

  // Data State
  const [provider, setProvider] = useState<Provider | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [distance, setDistance] = useState('Menghitung...');

  // Interaction State
  const [isFavorited, setIsFavorited] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Calendar State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Service Detail Modal State
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>('services');

  // Image Lightbox State
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Load Data
  useEffect(() => {
    if (! providerId) return;
    
    const loadData = async () => {
      try {
        setIsLoading(true);
        const providerRes = await fetchProviderById(providerId);
        setProvider(providerRes.data);

        const token = localStorage.getItem('posko_token');
        if (token) {
          const userRes = await fetchProfile();
          setCurrentUser(userRes.data.profile);
        } else {
          setDistance('Login untuk Jarak');
        }
      } catch (error) {
        console.error('Gagal memuat data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [providerId]);

  // Calculate Distance
  useEffect(() => {
    if (provider && currentUser?.location?.coordinates && provider.userId?.location?.coordinates) {
      const [uLng, uLat] = currentUser.location.coordinates;
      const [pLng, pLat] = provider.userId.location.coordinates;

      setDistance(uLat === 0 ? 'Set Alamat' : calculateDistance(uLat, uLng, pLat, pLng));
    }
  }, [provider, currentUser]);

  // Handlers
  const handleShare = async () => {
    setIsSharing(true);
    if (navigator.share && provider) {
      try {
        await navigator.share({
          title: `Jasa ${provider.userId?.fullName || 'Mitra'}`,
          text: 'Cek jasa profesional ini di Posko! ',
          url: window.location.href,
        });
      } catch (err) {
        /* Ignore share cancel */
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link tersalin! ');
    }
    setTimeout(() => setIsSharing(false), 500);
  };

  const handleToggleFavorite = () => {
    setIsFavorited(! isFavorited);
  };

  const handleOpenCalendar = () => {
    setIsCalendarOpen(true);
  };

  const handleCloseCalendar = () => {
    setIsCalendarOpen(false);
  };

  const handleChangeMonth = (delta: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentMonth(newDate);
  };

  const handleSelectService = (service: ServiceItem) => {
    setSelectedService(service);
  };

  const handleCloseServiceDetail = () => {
    setSelectedService(null);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleImageClick = (imageUrl: string) => {
    setLightboxImage(imageUrl);
  };

  const handleCloseLightbox = () => {
    setLightboxImage(null);
  };

  // Render Loading
  if (isLoading) {
    return <ProviderLoading />;
  }

  // Render Not Found
  if (! provider) {
    return <ProviderNotFound />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-12 font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200 transition-all">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="p-2 -ml-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <BackIcon />
          </Link>
          <h1 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Profil Mitra</h1>
          <div className="w-8"></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* 1.HERO SECTION */}
        <ProviderHeroSection
          provider={provider}
          distance={distance}
          isFavorited={isFavorited}
          isSharing={isSharing}
          onToggleFavorite={handleToggleFavorite}
          onShare={handleShare}
          onOpenCalendar={handleOpenCalendar}
        />

        {/* LAYOUT GRID UTAMA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* KOLOM KIRI (Tab Section: Services & Docs) */}
          <div className="lg:col-span-2">
            <ProviderTabSection
              provider={provider}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onSelectService={handleSelectService}
              onImageClick={handleImageClick}
            />
          </div>

          {/* KOLOM KANAN (Info Tambahan) */}
          <div className="hidden lg:block">
            <ProviderSidebar />
          </div>
        </div>
      </main>

      {/* MODALS */}
      <ProviderCalendarModal
        provider={provider}
        isOpen={isCalendarOpen}
        currentMonth={currentMonth}
        onClose={handleCloseCalendar}
        onChangeMonth={handleChangeMonth}
      />

      <ProviderServiceDetailModal
        provider={provider}
        selectedService={selectedService}
        onClose={handleCloseServiceDetail}
      />

      <ProviderImageLightbox
        imageUrl={lightboxImage}
        onClose={handleCloseLightbox}
      />

      {/* STICKY BOTTOM CTA (Mobile Only) */}
      <ProviderStickyBottomCTA provider={provider} />
    </div>
  );
}