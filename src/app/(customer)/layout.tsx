// src/app/(customer)/layout.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchProfile } from '@/features/auth/api';

// Icon Components
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-6 h-6 ${active ? 'text-red-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9M9 20l-2-7m6 7l2-7M9 5l3-3m6 3l-3-3" />
  </svg>
);

const SearchIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-6 h-6 ${active ? 'text-red-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const OrderIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-6 h-6 ${active ? 'text-red-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
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
          setIsProviderMode(res.data.profile?.activeRole === 'provider');
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
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  // [FIX] Jika sedang loading, jangan render apapun untuk menghindari flash
  if (isLoading) {
    return null;
  }

  // [FIX] Jika user dalam mode provider, jangan render BottomNav customer
  // ProviderHome yang akan menangani navbar-nya sendiri
  if (isProviderMode) {
    return null;
  }

  // [FIX] Jika pathname adalah '/', halaman home handle sendiri bottom nav-nya
  // Ini untuk menghindari double rendering
  if (pathname === '/') {
    return null;
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
          <span className={`text-[10px] font-bold ${isActive('/services') ? 'text-red-600' : 'text-gray-400'}`}>Layanan</span>
        </Link>
        
        <Link href="/orders" className="flex flex-col items-center gap-1 w-16">
          <OrderIcon active={isActive('/orders')} />
          <span className={`text-[10px] font-bold ${isActive('/orders') ? 'text-red-600' : 'text-gray-400'}`}>Pesanan</span>
        </Link>

        <Link href="/profile" className="flex flex-col items-center gap-1 w-16">
          <UserIcon active={isActive('/profile')} />
          <span className={`text-[10px] font-bold ${isActive('/profile') ? 'text-red-600' : 'text-gray-400'}`}>Akun</span>
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