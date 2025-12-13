// src/components/home/BecomePartnerSection.tsx
'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function BecomePartnerSection() {
  const { language } = useLanguage();

  const title = language === 'id' ? 'Gabung Jadi Mitra' : 'Become a Partner';
  const subtitle = language === 'id' 
    ? 'Dapat penghasilan tambahan!' 
    : 'Earn extra income!';
  const buttonText = language === 'id' ? 'Daftar' : 'Join';

  return (
    <section className="px-4 lg:px-8 mt-3 lg:mt-4 max-w-7xl mx-auto">
      {/* Container dibuat pipih, padding kecil (p-3), dan layout menyamping (flex-row) */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-3 lg:p-4 text-white shadow-sm flex items-center justify-between gap-3 relative overflow-hidden">
        
        {/* Dekorasi Background Minimalis (Bola Cahaya) */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Text Content (Sangat Compact) */}
        <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2">
             <h2 className="text-sm lg:text-base font-black leading-tight">{title}</h2>
             <span className="hidden sm:inline-block bg-white/20 px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold uppercase tracking-wider border border-white/20">
                {language === 'id' ? 'Lowongan' : 'Hiring'}
            </span>
          </div>
          <p className="text-white/90 text-[10px] lg:text-xs font-medium truncate mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Action Button (Kecil & Rapi) */}
        <div className="relative z-10 shrink-0">
          <Link 
            href="/register?role=provider" 
            className="block bg-white text-red-700 hover:bg-red-50 font-bold text-[10px] lg:text-xs px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg transition-all shadow-sm active:scale-95"
          >
            {buttonText}
          </Link>
        </div>
      </div>
    </section>
  );
}