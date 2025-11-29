// src/components/provider/ProviderBottomNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchProfile } from '@/features/auth/api';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

// Icon Components
const DashboardIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9M9 20l-2-7m6 7l2-7M9 5l3-3m6 3l-3-3" />
  </svg>
);

const JobsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const MessagesIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h. 01M21 12c0 4.418-4.03 8-9 8a9. 863 9.863 0 01-4.255-. 949L3 20l1. 395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const AccountIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  // Jangan render provider nav di halaman /provider/[id]
  if (pathname && pathname.match(/^\/provider\/[a-f0-9]+$/i)) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/(provider)/dashboard' && pathname === '/dashboard') return true;
    if (path === '/(provider)/jobs' && pathname === '/jobs') return true;
    if (path === '/chat' && pathname === '/chat') return true;
    if (path === '/profile' && pathname === '/profile') return true;
    return false;
  };

  const navItems: NavItem[] = [
    { href: '/dashboard', icon: <DashboardIcon />, label: 'Dashboard' },
    { href: '/jobs', icon: <JobsIcon />, label: 'Pesanan' },
    { href: '/chat', icon: <MessagesIcon />, label: 'Chat' },
    { href: '/profile', icon: <AccountIcon />, label: 'Akun' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-5 pt-2 px-6 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center">
        {navItems.map((item) => (
          <Link 
            key={item.href}
            href={item.href} 
            className="flex flex-col items-center gap-1 w-16"
          >
            <div className={`${isActive(item.href) ?  'text-red-600' : 'text-gray-400'}`}>
              {item.icon}
            </div>
            <span className={`text-[10px] font-bold ${isActive(item.href) ? 'text-red-600' : 'text-gray-400'}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}