// src/components/provider/ProviderBottomNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchProfile } from '@/features/auth/api';

// --- ICONS ---
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-6 h-6 ${active ?  'text-red-600' : 'text-gray-400'}`} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const OrderIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-6 h-6 ${active ? 'text-red-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h. 01M9 16h.01"/>
  </svg>
);

const ChatIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-6 h-6 ${active ? 'text-red-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-. 949L3 20l1. 395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3. 582 9 8z"/>
  </svg>
);

const UserIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-6 h-6 ${active ? 'text-red-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export default function ProviderBottomNav() {
  const pathname = usePathname();
  const [isProviderMode, setIsProviderMode] = useState<boolean | null>(null);

  // [FIX] Cek role user untuk memastikan navbar yang benar ditampilkan
  useEffect(() => {
    const checkUserMode = async () => {
      try {
        const token = localStorage.getItem('posko_token');
        if (token) {
          const res = await fetchProfile();
          setIsProviderMode(res.data.profile?.activeRole === 'provider');
        } else {
          setIsProviderMode(false);
        }
      } catch {
        setIsProviderMode(false);
      }
    };
    checkUserMode();
  }, []);

  // [FIX] Jangan render saat masih loading
  if (isProviderMode === null) {
    return null;
  }

  // [FIX] Jangan render jika user bukan provider mode
  if (! isProviderMode) {
    return null;
  }

  // [FIX] Deteksi halaman profil publik provider (yang dilihat customer)
  // Pattern: /provider/[mongoId] - tapi BUKAN halaman internal provider
  const isPublicProviderProfile = /^\/provider\/[a-f0-9]{24}$/i.test(pathname);
  
  // Jika sedang melihat halaman profil publik provider, jangan tampilkan navbar provider
  if (isPublicProviderProfile) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-5 pt-2 px-6 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center">
        <Link href="/" className="flex flex-col items-center gap-1 w-16">
          <HomeIcon active={isActive('/')} />
          <span className={`text-[10px] font-bold ${isActive('/') ?  'text-red-600' : 'text-gray-400'}`}>Beranda</span>
        </Link>
        
        <Link href="/jobs" className="flex flex-col items-center gap-1 w-16">
          <OrderIcon active={isActive('/jobs')} />
          <span className={`text-[10px] font-bold ${isActive('/jobs') ? 'text-red-600' : 'text-gray-400'}`}>Pesanan</span>
        </Link>

        <Link href="/chat" className="flex flex-col items-center gap-1 w-16">
          <ChatIcon active={isActive('/chat')} />
          <span className={`text-[10px] font-bold ${isActive('/chat') ?  'text-red-600' : 'text-gray-400'}`}>Chat</span>
        </Link>

        <Link href="/settings" className="flex flex-col items-center gap-1 w-16">
          <UserIcon active={isActive('/settings')} />
          <span className={`text-[10px] font-bold ${isActive('/settings') ?  'text-red-600' : 'text-gray-400'}`}>Akun</span>
        </Link>
      </div>
    </div>
  );
}