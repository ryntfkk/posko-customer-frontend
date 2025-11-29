// src/app/provider/[providerId]/page.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { fetchProviderById } from '@/features/providers/api';
import { fetchProfile } from '@/features/auth/api';
import { Provider } from '@/features/providers/types';
import { User } from '@/features/auth/types';
import { getUnitLabel } from '@/features/services/types';

// --- MOCK DATA (Hanya untuk Portofolio) ---
const MOCK_PORTFOLIO_IMAGES = [
  "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1581094794329-cd8119608f84?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=500&auto=format&fit=crop",
];

// --- FUNGSI HELPER ---
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math. PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math. atan2(Math. sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d < 1 ? `${(d * 1000).toFixed(0)} m` : `${d.toFixed(1)} km`;
}

function formatCurrency(amount: number) {
  return new Intl. NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

function formatDuration(minutes?: number): string {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes} mnt`;
  const hours = Math.floor(minutes / 60);
  const remainMins = minutes % 60;
  if (remainMins === 0) return `${hours} jam`;
  return `${hours}j ${remainMins}m`;
}

// --- ICONS (DIPERBAIKI - Path SVG Lengkap) ---
const ShareIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8. 684 13.342C8.886 12.938 9 12.482 9 12c0-. 482-. 114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6. 632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2. 684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5. 368-2.684z" />
  </svg>
);

const HeartIcon = ({ solid }: { solid: boolean }) => (
  <svg 
    className={`w-5 h-5 transition-transform active:scale-75 ${solid ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} 
    fill={solid ? "currentColor" : "none"} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6. 318a4.5 4.5 0 000 6.364L12 20.364l7.682-7. 682a4.5 4.5 0 00-6.364-6. 364L12 7.636l-1.318-1. 318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-3. 5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronLeft = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRight = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const BackIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

// Interface untuk service item
interface ServiceItem {
  serviceId: {
    _id: string;
    name: string;
    category: string;
    iconUrl?: string;
    unit?: string;
    unitLabel?: string;
    displayUnit?: string;
    shortDescription?: string;
    description?: string;
    estimatedDuration?: number;
    includes?: string[];
    excludes?: string[];
    requirements?: string[];
    isPromo?: boolean;
    promoPrice?: number;
    discountPercent?: number;
    basePrice?: number;
  };
  price: number;
  isActive: boolean;
}

export default function ProviderProfilePage() {
  const params = useParams();
  const providerId = Array.isArray(params.providerId) ?  params.providerId[0] : params. providerId;

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

  useEffect(() => {
    if (! providerId) return;
    const loadData = async () => {
      try {
        setIsLoading(true);
        const providerRes = await fetchProviderById(providerId);
        setProvider(providerRes. data);

        const token = localStorage.getItem('posko_token');
        if (token) {
          const userRes = await fetchProfile();
          setCurrentUser(userRes.data. profile);
        } else {
          setDistance('Login untuk Jarak');
        }
      } catch (error) {
        console. error("Gagal memuat data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [providerId]);

  useEffect(() => {
    if (provider && currentUser?. location?. coordinates && provider.userId?. location?.coordinates) {
      const [uLng, uLat] = currentUser.location.coordinates;
      const [pLng, pLat] = provider. userId.location.coordinates;

      setDistance(uLat === 0 ? 'Set Alamat' : calculateDistance(uLat, uLng, pLat, pLng));
    }
  }, [provider, currentUser]);

  const handleShare = async () => {
    setIsSharing(true);
    if (navigator.share && provider) {
      try {
        await navigator.share({
          title: `Jasa ${provider.userId.fullName}`,
          text: `Cek jasa profesional ini di Posko! `,
          url: window.location.href,
        });
      } catch (err) { /* Ignore share cancel */ }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link tersalin! ');
    }
    setTimeout(() => setIsSharing(false), 500);
  };

  const toggleFavorite = () => {
    setIsFavorited(! isFavorited);
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentMonth);
    newDate. setMonth(newDate.getMonth() + delta);
    setCurrentMonth(newDate);
  };

  // --- RENDER KALENDER KETERSEDIAAN ---
  const renderCalendarContent = () => {
    if (!provider) return null;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const blanks = Array. from({ length: firstDayIndex }, (_, i) => <div key={`blank-${i}`} />);

    const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = new Date(year, month, day);
      const offsetDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      const dateStr = offsetDate. toISOString().split('T')[0];

      const blockedSet = new Set(provider.blockedDates?. map((d: string) => d.split('T')[0]) || []);
      const bookedSet = new Set(provider.bookedDates?.map((d: string) => d.split('T')[0]) || []);

      const isBlocked = blockedSet.has(dateStr);
      const isBooked = bookedSet.has(dateStr);
      const isPast = dateStr < new Date(). toISOString(). split('T')[0];

      let bgClass = "bg-green-50 text-green-700 border-green-100";
      let label = "Ada";

      if (isPast) {
        bgClass = "bg-gray-50 text-gray-300 border-gray-100";
        label = "";
      } else if (isBooked) {
        bgClass = "bg-red-50 text-red-600 border-red-100";
        label = "Penuh";
      } else if (isBlocked) {
        bgClass = "bg-gray-100 text-gray-400 border-gray-200";
        label = "Libur";
      }

      return (
        <div key={day} className={`aspect-square rounded-lg border flex flex-col items-center justify-center text-xs ${bgClass}`}>
          <span className="font-bold">{day}</span>
          {! isPast && <span className="text-[8px] uppercase tracking-tight">{label}</span>}
        </div>
      );
    });

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4 bg-gray-50 p-2 rounded-xl">
          <button onClick={() => changeMonth(-1)} className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-100 text-gray-600">
            <ChevronLeft />
          </button>
          <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">
            {currentMonth. toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => changeMonth(1)} className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-100 text-gray-600">
            <ChevronRight />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['M', 'S', 'S', 'R', 'K', 'J', 'S']. map((d, i) => (
            <span key={i} className="text-[10px] font-bold text-gray-400">{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 max-h-[300px] overflow-y-auto">
          {blanks}
          {dayCells}
        </div>

        <div className="flex gap-3 mt-6 justify-center text-[10px] text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
          <div className="flex items-center gap-1. 5"><div className="w-2. 5 h-2.5 bg-green-500 rounded-full"></div>Tersedia</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>Penuh</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>Libur</div>
        </div>
      </div>
    );
  };

  // --- RENDER SERVICE DETAIL MODAL ---
  const renderServiceDetailModal = () => {
    if (!selectedService || !provider) return null;

    const service = selectedService. serviceId;
    const unitDisplay = service.displayUnit || service.unitLabel || getUnitLabel(service.unit as any || 'unit');
    const durationText = formatDuration(service.estimatedDuration);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedService(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                  {service.category}
                </span>
                {service.isPromo && service.discountPercent && service.discountPercent > 0 && (
                  <span className="text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded-full">
                    DISKON {service.discountPercent}%
                  </span>
                )}
              </div>
              <h3 className="font-bold text-lg text-gray-900">{service.name}</h3>
            </div>
            <button onClick={() => setSelectedService(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 shrink-0">
              <CloseIcon />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 overflow-y-auto max-h-[55vh]">
            {/* Harga & Info */}
            <div className="flex items-end justify-between bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl">
              <div>
                <p className="text-xs text-gray-500 mb-1">Harga Mitra</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-red-600">{formatCurrency(selectedService.price)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{unitDisplay}</p>
              </div>
              {durationText && (
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Estimasi</p>
                  <div className="flex items-center gap-1 justify-end">
                    <ClockIcon />
                    <p className="text-sm font-bold text-gray-900">{durationText}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Deskripsi */}
            {service.description && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Deskripsi</p>
                <p className="text-sm text-gray-700 leading-relaxed">{service.description}</p>
              </div>
            )}

            {/* Includes */}
            {service.includes && service.includes.length > 0 && (
              <div>
                <p className="text-xs font-bold text-green-600 uppercase mb-2">✓ Termasuk dalam layanan</p>
                <ul className="space-y-2 bg-green-50 p-3 rounded-xl">
                  {service.includes.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckIcon />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Excludes */}
            {service.excludes && service.excludes.length > 0 && (
              <div>
                <p className="text-xs font-bold text-red-500 uppercase mb-2">✗ Tidak termasuk</p>
                <ul className="space-y-2 bg-red-50 p-3 rounded-xl">
                  {service.excludes. map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <XIcon />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            {service.requirements && service.requirements. length > 0 && (
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase mb-2">📋 Syarat & Persiapan</p>
                <ul className="space-y-2 bg-blue-50 p-3 rounded-xl">
                  {service.requirements.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button
              onClick={() => setSelectedService(null)}
              className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-100 transition-colors"
            >
              Tutup
            </button>
            <Link
              href={`/checkout?type=direct&providerId=${provider._id}&serviceId=${service._id}`}
              className="flex-1 py-3 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors text-center"
              onClick={() => setSelectedService(null)}
            >
              Pesan Sekarang
            </Link>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) return <ProviderLoading />;
  if (! provider) return <ProviderNotFound />;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-12 font-sans">

      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200 transition-all">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/" className="p-2 -ml-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-full transition-colors">
            <BackIcon />
          </Link>
          <h1 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Profil Mitra</h1>
          <div className="w-8"></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-6 space-y-6">

        {/* 1. HERO SECTION */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-red-50 to-transparent rounded-full blur-3xl opacity-60 -mr-10 -mt-10 pointer-events-none"></div>

          <div className="flex flex-col md:flex-row gap-6 relative z-10">
            <div className="flex justify-center md:justify-start shrink-0">
              <div className="relative w-28 h-28 lg:w-36 lg:h-36">
                <div className="w-full h-full rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                  <Image
                    src={provider.userId.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg? seed=${provider.userId.fullName}`}
                    alt={provider.userId.fullName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className={`absolute bottom-2 right-2 w-5 h-5 border-4 border-white rounded-full ${provider.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} title={provider.isOnline ? "Online" : "Offline"}></div>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-3">
              <div>
                <h2 className="text-2xl lg:text-3xl font-black text-gray-900 leading-tight flex flex-col md:flex-row items-center md:items-end gap-2 justify-center md:justify-start">
                  {provider.userId.fullName}
                  <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full align-middle border border-blue-200">Terverifikasi ✓</span>
                </h2>
                <p className="text-sm text-gray-500 mt-1">{provider.userId.address?. city || 'Lokasi tidak tersedia'} • {distance}</p>
              </div>

              <p className="text-gray-600 text-sm leading-relaxed max-w-2xl mx-auto md:mx-0 bg-gray-50 p-3 rounded-xl border border-gray-100">
                &quot;{provider.userId.bio || 'Teknisi berpengalaman yang siap membantu masalah Anda dengan cepat dan profesional.'}&quot;
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <div className="flex items-center gap-4 divide-x divide-gray-200 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm w-full sm:w-auto justify-center sm:justify-start">
                  <div className="flex items-center gap-1. 5 pr-2">
                    <span className="text-yellow-500 text-lg">★</span>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-black text-gray-900 leading-none">{provider.rating?. toFixed(1) || '0. 0'}</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">Rating</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-start pl-4">
                    <span className="text-sm font-black text-gray-900 leading-none">50+</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase">Pesanan</span>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                  <button
                    onClick={() => setIsCalendarOpen(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl border bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <CalendarIcon />
                    <span className="text-xs font-bold">Lihat Jadwal</span>
                  </button>

                  {/* TOMBOL FAVORIT - DIPERBAIKI */}
                  <button 
                    onClick={toggleFavorite} 
                    className={`flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 ${isFavorited ? 'bg-red-50 border-red-200' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <HeartIcon solid={isFavorited} />
                  </button>

                  {/* TOMBOL SHARE - DIPERBAIKI */}
                  <button 
                    onClick={handleShare} 
                    className={`flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors ${isSharing ? 'scale-95' : ''}`}
                  >
                    <ShareIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LAYOUT GRID UTAMA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* KOLOM KIRI (Services & Docs) */}
          <div className="lg:col-span-2 space-y-6">

            {/* 2. SERVICES RATECARD */}
            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-blue-600 rounded-full block"></span>
                  Daftar Layanan
                </h3>
                <span className="text-xs text-gray-500">
                  {provider.services.filter((s: ServiceItem) => s.isActive). length} layanan
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {provider.services.filter((s: ServiceItem) => s.isActive).map((item: ServiceItem) => {
                  const service = item.serviceId;
                  const unitDisplay = service.displayUnit || service.unitLabel || getUnitLabel(service.unit as any || 'unit');
                  const durationText = formatDuration(service.estimatedDuration);
                  const hasDetails = (service.includes && service.includes.length > 0) || 
                                     (service.excludes && service.excludes.length > 0) ||
                                     (service.requirements && service.requirements.length > 0);

                  return (
                    <div
                      key={service._id}
                      className="relative flex flex-col p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-red-200 hover:shadow-md transition-all group"
                    >
                      {/* Badge Promo */}
                      {service.isPromo && service.discountPercent && service.discountPercent > 0 && (
                        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-md z-10">
                          -{service.discountPercent}%
                        </div>
                      )}

                      {/* Header: Icon + Name */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200 shrink-0 group-hover:bg-red-50 group-hover:border-red-100 transition-colors">
                          <img src={service.iconUrl || '/file. svg'} alt="Icon" className="w-7 h-7 object-contain opacity-70" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm group-hover:text-red-600 transition-colors leading-tight">
                            {service.name}
                          </h4>
                          <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">
                            {service.category}
                          </p>
                        </div>
                      </div>

                      {/* Short Description */}
                      {service.shortDescription && (
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                          {service. shortDescription}
                        </p>
                      )}

                      {/* Info Badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        {durationText && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                            <ClockIcon />
                            <span>{durationText}</span>
                          </div>
                        )}
                        {service.includes && service.includes. length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            <CheckIcon />
                            <span>{service.includes.length} termasuk</span>
                          </div>
                        )}
                      </div>

                      {/* Price & Actions */}
                      <div className="flex items-end justify-between mt-auto pt-3 border-t border-gray-50">
                        <div>
                          <p className="font-black text-gray-900 text-lg leading-none">
                            {formatCurrency(item.price)}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {unitDisplay}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasDetails && (
                            <button
                              onClick={() => setSelectedService(item)}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              Detail
                            </button>
                          )}
                          {/* TOMBOL PILIH - DIPERBAIKI: Mengarah ke Direct Order dengan providerId */}
                          <Link
                            href={`/checkout?type=direct&providerId=${provider._id}`}
                            className="text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1. 5 rounded-lg transition-colors"
                          >
                            Pilih
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {provider.services.filter((s: ServiceItem) => s.isActive).length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-500 text-sm">Mitra ini belum memiliki layanan aktif. </p>
                </div>
              )}
            </section>

            {/* 3. DOCUMENTATION SECTION */}
            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-red-600 rounded-full block"></span>
                  Dokumentasi
                </h3>
                <span className="text-xs text-gray-500 cursor-pointer hover:text-red-600">Lihat Semua</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {MOCK_PORTFOLIO_IMAGES.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group cursor-zoom-in border border-gray-100 shadow-sm">
                    <Image src={img} alt={`Portfolio ${idx + 1}`} fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* KOLOM KANAN (Info Tambahan) */}
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-blue-800 text-xs leading-relaxed">
              <p className="font-bold mb-1">✨ Jaminan Posko</p>
              <p>Layanan dari mitra ini dilindungi garansi layanan 7 hari dan asuransi pengerjaan. Uang Anda aman hingga pekerjaan selesai.</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-gray-600 text-xs leading-relaxed">
              <p className="font-bold mb-1 text-gray-800">💡 Tips Pemesanan</p>
              <p>Pastikan tanggal yang Anda pilih berwarna Hijau (Tersedia).  Tanggal Merah berarti Mitra sedang penuh atau libur. </p>
            </div>

            <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-green-800 text-xs leading-relaxed">
              <p className="font-bold mb-1">📞 Butuh Bantuan? </p>
              <p>Hubungi CS Posko jika ada kendala dalam pemesanan.  Kami siap membantu 24/7.</p>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL KALENDER */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setIsCalendarOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900">Jadwal Ketersediaan</h3>
              <button onClick={() => setIsCalendarOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                <CloseIcon />
              </button>
            </div>

            {renderCalendarContent()}

            <div className="p-4 bg-gray-50 text-center">
              <p className="text-xs text-gray-500">Pilih layanan dan tentukan tanggal saat checkout. </p>
              <button onClick={() => setIsCalendarOpen(false)} className="mt-3 w-full py-2. 5 bg-gray-900 text-white font-bold text-sm rounded-xl hover:bg-gray-800 transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SERVICE DETAIL */}
      {renderServiceDetailModal()}

      {/* STICKY BOTTOM CTA (Mobile Only) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 lg:hidden z-40 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col flex-1">
          <span className="text-[10px] text-gray-500 font-bold uppercase">Harga Mulai</span>
          <span className="text-lg font-black text-red-600">
            {provider.services.filter((s: ServiceItem) => s.isActive).length > 0
              ? formatCurrency(Math.min(...provider. services.filter((s: ServiceItem) => s.isActive).map((s: ServiceItem) => s.price)))
              : 'Hubungi CS'}
          </span>
        </div>
        {/* TOMBOL PESAN JASA - Mengarah ke Direct Order dengan semua layanan provider */}
        <Link
          href={`/checkout?type=direct&providerId=${provider._id}`}
          className="px-6 py-3 rounded-xl bg-red-600 text-white text-sm font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-transform active:scale-95 flex items-center gap-2"
        >
          Pesan Jasa
          <ArrowRightIcon />
        </Link>
      </div>

    </div>
  );
}

function ProviderLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin"></div>
        <span className="text-sm font-medium text-gray-500 animate-pulse">Memuat Profil Mitra...</span>
      </div>
    </div>
  );
}

function ProviderNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-2">
        <CloseIcon />
      </div>
      <h2 className="text-xl font-bold text-gray-900">Mitra Tidak Ditemukan</h2>
      <p className="text-sm text-gray-500">Mitra yang Anda cari tidak tersedia atau sudah tidak aktif.</p>
      <Link href="/" className="px-6 py-2. 5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
        Kembali ke Beranda
      </Link>
    </div>
  );
}