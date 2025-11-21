// src/app/provider/[providerId]/page.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { fetchProviderById } from '@/features/providers/api';
import { fetchProfile } from '@/features/auth/api';
import { Provider } from '@/features/providers/types';
import { User } from '@/features/auth/types';

// --- Helper Hitung Jarak ---
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius bumi (km)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  if (distance < 1) return `${(distance * 1000).toFixed(0)} m`;
  return `${distance.toFixed(1)} km`;
}

export default function ProviderProfilePage() {
  const params = useParams();
  // Handle jika providerId berupa array (edge case di Next.js)
  const providerId = Array.isArray(params.providerId) ? params.providerId[0] : params.providerId;

  // State
  const [provider, setProvider] = useState<Provider | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [distance, setDistance] = useState('Menghitung...');

  // 1. Fetch Data Provider & User
  useEffect(() => {
    if (!providerId) return;

    const loadData = async () => {
      try {
        setIsLoading(true);

        // A. Ambil Data Provider
        const providerRes = await fetchProviderById(providerId);
        setProvider(providerRes.data);

        // B. Ambil Data User (jika login)
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

  // 2. Hitung Jarak Real-time
  useEffect(() => {
    if (provider && currentUser) {
        const userCoords = currentUser.location?.coordinates;
        const provCoords = provider.userId?.location?.coordinates;

        // Pastikan kedua koordinat valid [lng, lat]
        if (
            userCoords && userCoords.length === 2 &&
            provCoords && provCoords.length === 2
        ) {
            const [userLng, userLat] = userCoords;
            const [provLng, provLat] = provCoords;

            // Cek apakah lokasi user masih default (0,0)
            if (userLat === 0 && userLng === 0) {
                setDistance('Set Alamat');
            } else {
                const dist = calculateDistance(userLat, userLng, provLat, provLng);
                setDistance(dist);
            }
        } else {
            setDistance('Lokasi N/A');
        }
    }
  }, [provider, currentUser]);

  // Tampilan Loading
  if (isLoading) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
          <div className="space-y-4 text-center">
            <div className="animate-pulse h-10 w-52 bg-gray-200 rounded-xl mx-auto" />
            <div className="animate-pulse h-24 w-[320px] bg-gray-200 rounded-2xl mx-auto" />
            <p className="text-sm text-gray-500">Menghitung jarak...</p>
          </div>
        </div>
    );
  }

  // Tampilan Not Found
  if (!provider) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
            <p className="text-lg font-bold text-gray-900">Mitra tidak ditemukan.</p>
            <Link href="/" className="text-red-600 font-bold hover:underline">Kembali ke Beranda</Link>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-red-600 flex items-center gap-2 font-semibold transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Kembali</span>
          </Link>
          <div className="flex flex-col">
            <span className="text-[10px] lg:text-[11px] font-bold uppercase tracking-wide text-gray-400">Profil Mitra</span>
            <h1 className="text-lg lg:text-xl font-bold text-gray-900 leading-none truncate max-w-[200px]">
                {provider.userId.fullName}
            </h1>
          </div>
          <Link
            href={`/checkout?type=direct&providerId=${provider._id}`}
            className="ml-auto px-4 py-2 text-xs lg:text-sm font-bold text-white bg-red-600 rounded-full hover:bg-red-700 transition-transform hover:-translate-y-0.5 shadow-md shadow-red-100"
          >
            Pesan Jasa
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 lg:px-8 py-8 space-y-6">
        {/* Hero Profile */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -mr-10 -mt-10"></div>
          
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start relative z-10">
            <div className="relative w-28 h-28 lg:w-32 lg:h-32 rounded-full border-4 border-white shadow-lg overflow-hidden shrink-0 bg-gray-100">
              <Image 
                src={provider.userId.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider.userId.fullName}`} 
                alt={provider.userId.fullName} 
                fill 
                className="object-cover" 
              />
            </div>
            <div className="flex-1 space-y-3 text-center md:text-left">
              <div>
                <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-1">{provider.userId.fullName}</h2>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
                        {provider.services[0]?.serviceId?.name || 'Layanan Umum'}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${distance === 'Set Alamat' ? 'bg-red-50 text-red-600' : 'text-gray-600 bg-gray-100'}`}>
                        {distance}
                    </span>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm leading-relaxed max-w-2xl mx-auto md:mx-0">
                {provider.userId.bio || 'Mitra profesional Posko, siap melayani kebutuhan perbaikan dan perawatan Anda.'}
              </p>
              
              <div className="flex justify-center md:justify-start items-center gap-6 pt-2">
                <div className="text-center md:text-left">
                    <div className="flex items-center gap-1 justify-center md:justify-start">
                        <span className="text-yellow-500">★</span>
                        <span className="font-black text-gray-900">{provider.rating ? provider.rating.toFixed(1) : 'New'}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Rating</p>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="text-center md:text-left">
                    <p className="font-black text-gray-900">50+</p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Ulasan</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ratecard Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 bg-red-600 rounded-full"></div>
            <h3 className="text-lg font-bold text-gray-900">Daftar Layanan & Harga</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {provider.services.length === 0 ? (
                <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
                    <p>Belum ada layanan yang diaktifkan oleh mitra ini.</p>
                </div>
            ) : (
                provider.services
                  .filter(svc => svc.isActive)
                  .map((item) => (
                    <div
                        key={item.serviceId._id}
                        className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-red-200 hover:shadow-lg transition-all group cursor-pointer"
                    >
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <h4 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">{item.serviceId.name}</h4>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.serviceId.category} • Layanan Profesional</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-sm font-black text-gray-900">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price)}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
                            <Link
                                href={`/checkout?type=direct&providerId=${provider._id}`}
                                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                            >
                                Pesan <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                            </Link>
                        </div>
                    </div>
                ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}