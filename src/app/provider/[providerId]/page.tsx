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

// --- MOCK DATA ---
const MOCK_PORTFOLIO_IMAGES = [
  "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1581094794329-cd8119608f84?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=500&auto=format&fit=crop",
];

const MOCK_SCHEDULE = [
  { day: 'Senin', time: '08:00 - 20:00', status: 'open' },
  { day: 'Selasa', time: '08:00 - 20:00', status: 'open' },
  { day: 'Rabu', time: '08:00 - 20:00', status: 'open' },
  { day: 'Kamis', time: '08:00 - 20:00', status: 'open' },
  { day: 'Jumat', time: '13:00 - 21:00', status: 'open' },
  { day: 'Sabtu', time: '09:00 - 17:00', status: 'open' },
  { day: 'Minggu', time: 'Tutup', status: 'closed' },
];

// --- FUNGSI HELPER ---
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d < 1 ? `${(d * 1000).toFixed(0)} m` : `${d.toFixed(1)} km`;
}

// Icon Components
const ShareIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
);

const HeartIcon = ({ solid }: { solid: boolean }) => (
  <svg className={`w-5 h-5 transition-transform active:scale-75 ${solid ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} fill={solid ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

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
  const [favCount, setFavCount] = useState(128); 
  const [isSharing, setIsSharing] = useState(false);

  // Hari ini untuk highlight jadwal
  const todayIndex = (new Date().getDay() + 6) % 7; // 0 = Senin, 6 = Minggu

  useEffect(() => {
    if (!providerId) return;
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
        console.error("Gagal memuat data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [providerId]);

  useEffect(() => {
    if (provider && currentUser?.location?.coordinates && provider.userId?.location?.coordinates) {
       const [uLng, uLat] = currentUser.location.coordinates;
       const [pLng, pLat] = provider.userId.location.coordinates;
       
       setDistance(uLat === 0 ? 'Set Alamat' : calculateDistance(uLat, uLng, pLat, pLng));
    }
  }, [provider, currentUser]);

  const handleShare = async () => {
    setIsSharing(true);
    if (navigator.share && provider) {
      try {
        await navigator.share({
          title: `Jasa ${provider.userId.fullName}`,
          text: `Cek jasa profesional ini di Posko!`,
          url: window.location.href,
        });
      } catch (err) { /* Ignore share cancel */ }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link tersalin!');
    }
    setTimeout(() => setIsSharing(false), 500);
  };

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
    setFavCount(prev => isFavorited ? prev - 1 : prev + 1);
  };

  if (isLoading) return <ProviderLoading />;
  if (!provider) return <ProviderNotFound />;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-12 font-sans">
      
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200 transition-all">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/" className="p-2 -ml-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
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
                            src={provider.userId.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider.userId.fullName}`} 
                            alt={provider.userId.fullName} 
                            fill 
                            className="object-cover" 
                        />
                    </div>
                    <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-4 border-white rounded-full" title="Online"></div>
                </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-3">
                <div>
                    <h2 className="text-2xl lg:text-3xl font-black text-gray-900 leading-tight flex flex-col md:flex-row items-center md:items-end gap-2 justify-center md:justify-start">
                        {provider.userId.fullName}
                        <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full align-middle border border-blue-200">Terverifikasi ✓</span>
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">{provider.userId.address?.city || 'Lokasi tidak tersedia'} • {distance}</p>
                </div>

                <p className="text-gray-600 text-sm leading-relaxed max-w-2xl mx-auto md:mx-0 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    &quot;{provider.userId.bio || 'Teknisi berpengalaman yang siap membantu masalah Anda dengan cepat dan profesional.'}&quot;
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                    <div className="flex items-center gap-4 divide-x divide-gray-200 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm">
                        <div className="flex items-center gap-1.5 pr-2">
                            <span className="text-yellow-500 text-lg">★</span>
                            <div className="flex flex-col items-start">
                                <span className="text-sm font-black text-gray-900 leading-none">{provider.rating.toFixed(1)}</span>
                                <span className="text-[9px] text-gray-400 font-bold uppercase">Rating</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-start pl-4">
                            <span className="text-sm font-black text-gray-900 leading-none">50+</span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase">Pesanan</span>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={toggleFavorite} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 ${isFavorited ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                            <HeartIcon solid={isFavorited} />
                            <span className="text-xs font-bold">{favCount}</span>
                        </button>
                        <button onClick={handleShare} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 ${isSharing ? 'scale-95 bg-gray-100' : ''}`}>
                            <ShareIcon />
                            <span className="text-xs font-bold">Bagikan</span>
                        </button>
                    </div>
                </div>
            </div>
          </div>
        </section>

        {/* LAYOUT GRID UTAMA (2 Kolom di Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* KOLOM KIRI (Services & Docs) */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* 2. SERVICES RATECARD */}
                <section>
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full block"></span>
                            Daftar Layanan
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {provider.services.filter(s => s.isActive).map((item) => (
                            <div key={item.serviceId._id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-red-200 transition-colors group cursor-default">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200 shrink-0 group-hover:bg-red-50 group-hover:border-red-100 transition-colors">
                                        <img src={item.serviceId.iconUrl || '/file.svg'} alt="Icon" className="w-6 h-6 object-contain opacity-70" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm group-hover:text-red-600 transition-colors">{item.serviceId.name}</h4>
                                        <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide text-left">{item.serviceId.category}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-gray-900 text-sm">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price)}
                                    </p>
                                    {/* Tombol Pesan Khusus Layanan */}
                                    <Link 
                                        href={`/checkout?type=direct&providerId=${provider._id}&serviceId=${item.serviceId._id}`}
                                        className="mt-1 inline-block text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded-md transition-colors"
                                    >
                                        Pilih
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
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
                                <Image src={img} alt={`Dokumentasi ${idx+1}`} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* KOLOM KANAN (Jadwal & Info Tambahan) */}
            <div className="space-y-6">
                
                {/* 4. SCHEDULE SECTION */}
                <section className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <ClockIcon />
                            Jadwal Operasional
                        </h3>
                        {MOCK_SCHEDULE[todayIndex].status === 'open' ? (
                            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">Buka Sekarang</span>
                        ) : (
                            <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">Tutup</span>
                        )}
                    </div>
                    <div className="space-y-2">
                        {MOCK_SCHEDULE.map((s, idx) => {
                            const isToday = idx === todayIndex;
                            return (
                                <div key={s.day} className={`flex justify-between text-sm py-1.5 px-2 rounded-lg ${isToday ? 'bg-gray-100 font-semibold' : ''}`}>
                                    <span className={`w-20 ${isToday ? 'text-gray-900' : 'text-gray-500'}`}>{s.day}</span>
                                    <span className={s.status === 'closed' ? 'text-red-500' : 'text-gray-700'}>{s.time}</span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Info Tambahan */}
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-blue-800 text-xs leading-relaxed">
                    <p className="font-bold mb-1">✨ Jaminan Posko</p>
                    <p>Layanan dari mitra ini dilindungi garansi layanan 7 hari dan asuransi pengerjaan.</p>
                </div>
            </div>

        </div>
      </main>

      {/* STICKY BOTTOM CTA (Mobile Only) - Perbaikan di sini: Link Umum */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 lg:hidden z-40 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
         <div className="flex flex-col flex-1">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Harga Mulai</span>
            <span className="text-lg font-black text-red-600">
                {provider.services.length > 0 
                    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Math.min(...provider.services.map(s => s.price))) 
                    : 'Hubungi CS'}
            </span>
         </div>
         <Link
            href={`/checkout?type=direct&providerId=${provider._id}`} // Generic link untuk mobile CTA
            className="px-6 py-3 rounded-xl bg-red-600 text-white text-sm font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-transform active:scale-95 flex items-center gap-2"
        >
            Pesan Jasa
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
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
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Mitra Tidak Ditemukan</h2>
        <Link href="/" className="px-6 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
            Kembali ke Beranda
        </Link>
    </div>
  );
}