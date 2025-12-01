// src/app/(customer)/profile/page.tsx
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
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header Mobile */}
      <div className="bg-white px-6 pt-12 pb-6 border-b border-gray-100 sticky top-0 z-20">
        <h1 className="text-2xl font-bold text-gray-900">Akun Saya</h1>
      </div>

      <div className="p-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden border border-gray-200 shrink-0 relative">
            <Image 
              src={user.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.fullName}`} 
              alt="Avatar" 
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">{user.fullName}</h2>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border bg-gray-100 text-gray-600 border-gray-200">
              Pelanggan
            </span>
          </div>
        </div>

        {/* Menu Utama */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <Link href="/orders" className="flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Daftar Pesanan Saya</span>
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

        <button onClick={handleLogout} className="w-full py-4 text-sm font-bold text-red-600 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors">
            Keluar Aplikasi
        </button>
      </div>
    </div>
  );
}