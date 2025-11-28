// src/app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { fetchProfile, switchRole } from '@/features/auth/api'; // Import switchRole
import { User } from '@/features/auth/types';

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
    router.push('/login');
  };

  const handleSwitchMode = async () => {
    if (!user) return;
    setSwitching(true);
    
    // Jika user adalah customer -> Arahkan ke halaman daftar mitra (placeholder)
    const isProvider = user.roles.includes('provider');
    
    if (!isProvider) {
        // Logic Daftar Mitra
        alert("Fitur pendaftaran mitra akan segera hadir!");
        setSwitching(false);
        return;
    }

    // Jika sudah provider -> Switch active role
    try {
        const targetRole = user.activeRole === 'provider' ? 'customer' : 'provider';
        await switchRole(targetRole);
        // Refresh halaman atau redirect ke home untuk melihat perubahan
        window.location.href = '/'; 
    } catch (error) {
        console.error("Gagal pindah mode", error);
    } finally {
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
          <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
            <img 
              src={user.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.fullName}`} 
              alt="Avatar" 
              className="w-full h-full object-cover"
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
            <Link href="/orders" className="flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Daftar Pesanan</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </Link>
            
            <button onClick={handleSwitchMode} disabled={switching} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isProvider ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                        {isProvider ? (
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        ) : (
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                        {switching ? 'Memproses...' : isProvider ? (isCurrentlyProviderMode ? 'Pindah ke Mode Customer' : 'Pindah ke Mode Provider') : 'Daftar Jadi Mitra'}
                    </span>
                </div>
                {!switching && <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>}
            </button>
        </div>

        {/* Menu Lainnya */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Pengaturan Akun</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </div>
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Bantuan & Support</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </div>
        </div>

        <button onClick={handleLogout} className="w-full py-4 text-sm font-bold text-red-600 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors">
            Keluar Aplikasi
        </button>
      </div>

      {/* Bottom Nav (Sama seperti Home) */}
      <div className="fixed bottom-0 left-0 right-0 pb-5 pt-2 px-4 bg-gradient-to-t from-white via-white/90 to-transparent z-40">
          <nav className="bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-2xl px-6 py-3.5 flex justify-between items-center">
            <Link href="/" className="flex flex-col items-center justify-center gap-1 w-12 text-gray-400 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            </Link>
            {/* Tombol Order dummy */}
            <button className="flex flex-col items-center justify-center gap-1 w-12 text-gray-400 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
            </button>
            {/* Tombol Chat dummy */}
            <button className="flex flex-col items-center justify-center gap-1 w-12 text-gray-400 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            </button>
            {/* Profile Active */}
            <Link href="/profile" className="flex flex-col items-center justify-center gap-1 w-12 text-red-600 transition-colors">
                <div className="relative">
                    <svg className="w-6 h-6" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-600 rounded-full border-2 border-white"></span>
                </div>
            </Link>
          </nav>
        </div>
    </div>
  );
}