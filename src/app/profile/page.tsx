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
    // Nanti ini akan redirect ke URL aplikasi Provider
    alert("Silakan kunjungi aplikasi Mitra kami untuk mendaftar.");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Memuat...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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
            <p className="text-gray-500">{user?.phoneNumber}</p>
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="px-4 space-y-4">
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

            {/* [BARU] Voucher Saya */}
            <Link href="/profile/vouchers" className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
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
            
            {/* Opsi Daftar Mitra (Link Eksternal) */}
            <button onClick={handleRegisterProvider} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-50 text-green-600">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                        Daftar Jadi Mitra
                    </span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full bg-white p-4 rounded-xl shadow-sm text-red-600 font-medium border border-gray-100 hover:bg-red-50 transition-colors"
        >
          Keluar
        </button>
      </div>

      {/* Bottom Nav Placeholder (handled by layout) */}
    </div>
  );
}