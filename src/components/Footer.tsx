// src/components/Footer.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const { language } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 pt-6 pb-24 lg:pb-8 text-gray-600 font-sans">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Grid Utama: Mobile 2 Kolom, Desktop 4 Kolom */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 lg:gap-8 mb-8">
          
          {/* Brand Column (Full width di mobile agar logo jelas) */}
          <div className="col-span-2 lg:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative w-6 h-6 opacity-90">
                <Image src="/logo.png" alt="Posko Logo" fill className="object-contain" />
              </div>
              <span className="text-lg font-black text-gray-900 tracking-tight">
                POSKO<span className="text-red-600">.</span>
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-gray-500 max-w-xs">
              {language === 'id' 
                ? 'Solusi satu aplikasi untuk segala kebutuhan jasa perbaikan dan perawatan rumah tangga Anda.' 
                : 'One-stop application solution for all your household repair and maintenance service needs.'}
            </p>
          </div>

          {/* Links Column 1 */}
          <div>
            <h4 className="font-bold text-gray-900 text-xs mb-3">Perusahaan</h4>
            <ul className="space-y-2 text-[11px]">
              <li><Link href="/about" className="hover:text-red-600 transition-colors">Tentang Kami</Link></li>
              <li><Link href="/blog" className="hover:text-red-600 transition-colors">Blog</Link></li>
              <li><Link href="/careers" className="hover:text-red-600 transition-colors">Karir</Link></li>
              <li><Link href="/contact" className="hover:text-red-600 transition-colors">Hubungi Kami</Link></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h4 className="font-bold text-gray-900 text-xs mb-3">Dukungan</h4>
            <ul className="space-y-2 text-[11px]">
              <li><Link href="/help" className="hover:text-red-600 transition-colors">Pusat Bantuan</Link></li>
              <li><Link href="/terms" className="hover:text-red-600 transition-colors">Syarat & Ketentuan</Link></li>
              <li><Link href="/privacy" className="hover:text-red-600 transition-colors">Kebijakan Privasi</Link></li>
              <li><Link href="/faq" className="hover:text-red-600 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Download Column */}
          <div className="col-span-2 lg:col-span-1">
            <h4 className="font-bold text-gray-900 text-xs mb-3">Download App</h4>
            <div className="flex flex-row lg:flex-col gap-2">
                {/* App Store Button */}
                <button className="flex-1 lg:flex-none flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors border border-gray-800">
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-1.23 3.91-1.12.92.05 1.78.32 2.44 1.18-.76.41-1.28 1.19-1.28 2.06 0 1.28 1.05 2.32 2.33 2.32.09 0 .19-.01.28-.02-.12 3.17-2.37 6.95-2.76 7.81zm-3.81-16c.35 1.57-1.32 3.12-2.84 2.87-.21-1.49 1.17-3.27 2.84-2.87z"/></svg>
                    <div className="text-left leading-none">
                        <div className="text-[8px] uppercase font-medium text-gray-400">Download on</div>
                        <div className="text-[10px] font-bold">App Store</div>
                    </div>
                </button>
                
                {/* Google Play Button */}
                <button className="flex-1 lg:flex-none flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors border border-gray-800">
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L3.84,2.15C3.84,2.15 6.05,2.66 6.05,2.66Z" /></svg>
                    <div className="text-left leading-none">
                        <div className="text-[8px] uppercase font-medium text-gray-400">Get it on</div>
                        <div className="text-[10px] font-bold">Google Play</div>
                    </div>
                </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 pt-4 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] text-gray-400">
          <p>&copy; {currentYear} Posko Indonesia.</p>
          <div className="flex gap-4">
             <Link href="#" className="hover:text-gray-600 transition-colors">Instagram</Link>
             <Link href="#" className="hover:text-gray-600 transition-colors">Twitter</Link>
             <Link href="#" className="hover:text-gray-600 transition-colors">LinkedIn</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}