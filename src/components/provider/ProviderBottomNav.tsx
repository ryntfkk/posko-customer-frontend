// src/components/provider/ProviderBottomNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-6 h-6 ${active ? 'text-red-600' : 'text-gray-400'}`} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
);

const JobsIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-6 h-6 ${active ? 'text-red-600' : 'text-gray-400'}`} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
);

const ChatIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-6 h-6 ${active ? 'text-red-600' : 'text-gray-400'}`} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
);

const UserIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-6 h-6 ${active ? 'text-red-600' : 'text-gray-400'}`} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);

export default function ProviderBottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-5 pt-2 px-6 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center">
        <Link href="/provider/dashboard" className="flex flex-col items-center gap-1">
          <HomeIcon active={isActive('/provider/dashboard')} />
          <span className={`text-[10px] font-bold ${isActive('/provider/dashboard') ? 'text-red-600' : 'text-gray-400'}`}>Beranda</span>
        </Link>
        
        <Link href="/provider/jobs" className="flex flex-col items-center gap-1">
          <JobsIcon active={isActive('/provider/jobs')} />
          <span className={`text-[10px] font-bold ${isActive('/provider/jobs') ? 'text-red-600' : 'text-gray-400'}`}>Pekerjaan</span>
        </Link>

        <Link href="/chat" className="flex flex-col items-center gap-1">
          <ChatIcon active={isActive('/chat')} />
          <span className={`text-[10px] font-bold ${isActive('/chat') ? 'text-red-600' : 'text-gray-400'}`}>Chat</span>
        </Link>

        <Link href="/profile" className="flex flex-col items-center gap-1">
          <UserIcon active={isActive('/profile')} />
          <span className={`text-[10px] font-bold ${isActive('/profile') ? 'text-red-600' : 'text-gray-400'}`}>Akun</span>
        </Link>
      </div>
    </div>
  );
}