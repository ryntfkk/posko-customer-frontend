// src/app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { fetchProfile } from '@/features/auth/api';
import { User } from '@/features/auth/types';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetchProfile();
        setUser(res.data.profile);
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('posko_token');
    localStorage.removeItem('posko_refresh_token');
    router.push('/login');
  };

  const handleRegisterProvider = () => {
    // Aksi untuk user yang belum jadi mitra
    alert("Silakan kunjungi aplikasi Mitra kami untuk mendaftar.");
  };

  const handleSwitchToProvider = () => {
    // Aksi untuk user yang SUDAH jadi mitra
    // Nanti arahkan ke dashboard mitra atau halaman switch role
    alert("Beralih ke Mode Mitra...");
    // router.push('/provider/dashboard'); 
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Memuat...</div>;

  // Helper untuk mengecek apakah user adalah provider
  const isProvider = user?.roles?.includes('provider');

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header Profile */}
      <div className="bg-white p-6 mb-4 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-16 h-16 bg-gray-200 rounded-full overflow-hidden">
            {user?.profilePictureUrl ? (
              <Image 
                src={user.profilePictureUrl} 
                alt={user.fullName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user?.fullName}</h1>
            <p className="text-gray-500">{user?.phoneNumber || user?.email}</p>
            {/* Label Role User */}
            <div className="flex gap-2 mt-1">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                    Customer
                </span>
                {isProvider && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        Mitra
                    </span>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu List Container */}
      <div className="px-4 space-y-6">

        {/* SECTION 1: AKTIVITAS */}
        <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-3 px-1 uppercase tracking-wider">Aktivitas Saya</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Voucher Saya */}
                <Link href="/profile/vouchers" className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-50 text-purple-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                            Voucher Saya
                        </span>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </Link>
            </div>
        </div>

        {/* SECTION 2: AKUN */}
        <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-3 px-1 uppercase tracking-wider">Akun Saya</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Edit Profil */}
                <Link href="/profile/edit" className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-50 text-blue-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                            Edit Profil
                        </span>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </Link>

                {/* [BARU] Alamat Tersimpan */}
                <Link href="/profile/address" className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-orange-50 text-orange-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                            Alamat Tersimpan
                        </span>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </Link>

                {/* [BARU] Keamanan Akun */}
                <Link href="/profile/security" className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                            Keamanan Akun
                        </span>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </Link>
            </div>
        </div>
        
        {/* SECTION 3: MITRA AREA */}
        <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-3 px-1 uppercase tracking-wider">Area Mitra</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {isProvider ? (
                    // TAMPILAN JIKA SUDAH JADI MITRA
                    <button onClick={handleSwitchToProvider} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-50 text-green-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">
                                    Masuk Mode Mitra
                                </span>
                                <span className="text-xs text-gray-500">
                                    Kelola pesanan dan layanan Anda
                                </span>
                            </div>
                        </div>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                ) : (
                    // TAMPILAN JIKA BELUM JADI MITRA
                    <button onClick={handleRegisterProvider} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-teal-50 text-teal-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">
                                    Daftar Jadi Mitra
                                </span>
                                <span className="text-xs text-gray-500">
                                    Mulai tawarkan jasa Anda di Posko
                                </span>
                            </div>
                        </div>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                )}
            </div>
        </div>

        {/* SECTION 4: INFO & KELUAR */}
        <div className="pb-8">
            <h3 className="text-sm font-semibold text-gray-500 mb-3 px-1 uppercase tracking-wider">Lainnya</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
                {/* Pusat Bantuan */}
                <Link href="/help" className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                            Pusat Bantuan
                        </span>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </Link>

                {/* Syarat & Ketentuan */}
                <Link href="/terms" className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors last:border-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                            Syarat & Ketentuan
                        </span>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </Link>
            </div>

            {/* Logout Button */}
            <button 
                onClick={handleLogout}
                className="w-full bg-white p-4 rounded-xl shadow-sm text-red-600 font-medium border border-gray-100 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Keluar Aplikasi
            </button>
            
            <div className="mt-6 text-center">
                <p className="text-xs text-gray-400">Posko App v1.0.0</p>
            </div>
        </div>
      </div>
    </div>
  );
}