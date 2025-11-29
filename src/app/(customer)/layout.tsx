// src/app/(customer)/layout.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchProfile } from '@/features/auth/api';

// Icon Components
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-6 h-6 ${active ? 'text-red-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const SearchIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-6 h-6 ${active ? 'text-red-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const OrderIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-6 h-6 ${active ? 'text-red-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const UserIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-6 h-6 ${active ? 'text-red-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

// Mobile Bottom Navigation Only
function BottomNav() {
  const pathname = usePathname();
  const [isProviderMode, setIsProviderMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkUserMode = async () => {
      try {
        const token = localStorage.getItem('posko_token');
        if (token) {
          const res = await fetchProfile();
          // Cek apakah user sedang dalam mode provider
          setIsProviderMode(res.data.profile?. activeRole === 'provider');
        }
      } catch (error) {
        // Jika error (misal token expired), anggap sebagai customer
        setIsProviderMode(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkUserMode();
  }, []);
  
  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname. startsWith(path)) return true;
    return false;
  };

  // PERBAIKAN UTAMA: Jika user dalam mode provider, JANGAN render BottomNav customer
  // Biarkan ProviderHome yang menangani navbar-nya sendiri
  if (isLoading) {
    return null; // Jangan render apapun saat loading
  }

  if (isProviderMode) {
    return null; // Jangan render BottomNav customer jika mode provider
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-5 pt-2 px-6 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center">
        <Link href="/" className="flex flex-col items-center gap-1 w-16">
          <HomeIcon active={isActive('/')} />
          <span className={`text-[10px] font-bold ${isActive('/') ? 'text-red-600' : 'text-gray-400'}`}>Beranda</span>
        </Link>
        
        <Link href="/services" className="flex flex-col items-center gap-1 w-16">
          <SearchIcon active={isActive('/services')} />
          <span className={`text-[10px] font-bold ${isActive('/services') ?  'text-red-600' : 'text-gray-400'}`}>Layanan</span>
        </Link>
        
        <Link href="/orders" className="flex flex-col items-center gap-1 w-16">
          <OrderIcon active={isActive('/orders')} />
          <span className={`text-[10px] font-bold ${isActive('/orders') ?  'text-red-600' : 'text-gray-400'}`}>Pesanan</span>
        </Link>

        <Link href="/profile" className="flex flex-col items-center gap-1 w-16">
          <UserIcon active={isActive('/profile')} />
          <span className={`text-[10px] font-bold ${isActive('/profile') ?  'text-red-600' : 'text-gray-400'}`}>Akun</span>
        </Link>
      </div>
    </div>
  );
}

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* TIDAK ADA NAVBAR DESKTOP - Sudah dihandle oleh masing-masing page */}
      <main className="min-h-screen pb-24 lg:pb-0">
        {children}
      </main>
      {/* BOTTOM NAV HANYA UNTUK MOBILE - Sekarang dengan pengecekan mode */}
      <BottomNav />
    </>
  );
}