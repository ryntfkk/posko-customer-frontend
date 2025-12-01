// src/app/(customer)/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { fetchProfile, switchRole } from '@/features/auth/api';
import { User } from '@/features/auth/types';
import ProviderBottomNav from '@/components/provider/ProviderBottomNav';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

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

  const handleSwitchMode = async () => {
    if (!user) return;
    setSwitching(true);
    
    const isProvider = user.roles.includes('provider');
    
    if (!isProvider) {
        alert("Fitur pendaftaran mitra akan segera hadir!");
        setSwitching(false);
        return;
    }

    try {
        const targetRole = user.activeRole === 'provider' ? 'customer' : 'provider';
        await switchRole(targetRole);
        
        // [UPDATE] Redirect sesuai role tujuan
        if (targetRole === 'provider') {
            window.location.href = '/dashboard';
        } else {
            window.location.href = '/';
        }
    } catch (error) {
        console.error("Gagal pindah mode", error);
        alert("Gagal mengubah mode akun. Silakan coba lagi.");
        setSwitching(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Memuat...</div>;
  if (!user) return null;

  const isProvider = user.roles.includes('provider');
  const isCurrentlyProviderMode = user.activeRole === 'provider';

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
            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${isCurrentlyProviderMode ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
              {isCurrentlyProviderMode ? 'Mode Mitra' : 'Mode Pengguna'}
            </span>
          </div>
        </div>

        {/* Menu Utama */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Tampilkan Menu sesuai Role */}
            {isCurrentlyProviderMode ? (
                <>
                    <Link href="/dashboard" className="flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            </div>
                            <span className="text-sm font-medium text-gray-700">Dashboard Mitra</span>
                        </div>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </Link>
                    <Link href="/settings" className="flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                            <span className="text-sm font-medium text-gray-700">Pengaturan Layanan</span>
                        </div>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </Link>
                </>
            ) : (
                <Link href="/orders" className="flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Daftar Pesanan Saya</span>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </Link>
            )}
            
            <button onClick={handleSwitchMode} disabled={switching} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isProvider ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'}`}>
                        {isProvider ? (
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        ) : (
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                        {switching ? 'Memproses...' : isProvider ? (isCurrentlyProviderMode ? 'Pindah ke Mode Customer' : 'Pindah ke Mode Mitra') : 'Daftar Jadi Mitra'}
                    </span>
                </div>
                {!switching && <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>}
            </button>
        </div>

        <button onClick={handleLogout} className="w-full py-4 text-sm font-bold text-red-600 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors">
            Keluar Aplikasi
        </button>
      </div>

      {/* Tampilkan Navigasi Provider jika dalam mode provider */}
      {isCurrentlyProviderMode && <ProviderBottomNav />}
    </div>
  );
}