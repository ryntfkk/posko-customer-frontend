// src/components/ProviderHome.tsx
'use client';

import { User } from '@/features/auth/types';

interface ProviderHomeProps {
  user: User;
}

export default function ProviderHome({ user }: ProviderHomeProps) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-10 animate-fadeIn font-sans">
      
      {/* --- HERO SECTION PROVIDER --- */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-6 lg:p-10 text-white shadow-xl relative overflow-hidden mb-8 lg:mb-10">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Mitra Resmi</span>
          </div>
          <h1 className="text-2xl lg:text-4xl font-bold mb-2 leading-tight">
            Halo, {user.fullName.split(' ')[0]}! 👋
          </h1>
          <p className="text-blue-100 text-sm lg:text-base opacity-90 max-w-lg">
            Pantau performa dan terima pesanan pelanggan dengan cepat dari sini.
          </p>
          
          {/* Stats Row */}
          <div className="flex flex-wrap gap-3 lg:gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 flex-1 min-w-[120px]">
              <p className="text-lg lg:text-2xl font-bold">Rp 1.2jt</p>
              <p className="text-[10px] lg:text-xs text-blue-200">Pendapatan (Bulan Ini)</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 flex-1 min-w-[100px]">
              <p className="text-lg lg:text-2xl font-bold flex items-center gap-1">
                4.9 <span className="text-sm text-yellow-400">★</span>
              </p>
              <p className="text-[10px] lg:text-xs text-blue-200">Rating Layanan</p>
            </div>
          </div>
        </div>
        
        {/* Background Decoration */}
        <div className="absolute -right-10 -bottom-20 w-48 h-48 lg:w-64 lg:h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      </div>

      {/* --- QUICK ACTIONS (MOBILE ONLY) --- */}
      <div className="grid grid-cols-2 gap-3 mb-8 lg:hidden">
         <button className="bg-blue-50 p-4 rounded-xl flex flex-col items-center gap-2 border border-blue-100 active:scale-95 transition-transform">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="text-xs font-bold text-blue-800">Saldo</span>
         </button>
         <button className="bg-green-50 p-4 rounded-xl flex flex-col items-center gap-2 border border-green-100 active:scale-95 transition-transform">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            </div>
            <span className="text-xs font-bold text-green-800">Riwayat</span>
         </button>
      </div>

      {/* --- INCOMING ORDERS SECTION --- */}
      <div>
        <div className="flex justify-between items-end mb-4 lg:mb-6">
            <h2 className="text-lg lg:text-xl font-bold text-gray-900">Pesanan Masuk (Demo)</h2>
            <button className="text-xs lg:text-sm font-bold text-blue-600 hover:underline">Lihat Semua</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-5 lg:p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group">
                    <div className="flex justify-between items-start mb-4">
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-[10px] lg:text-xs font-bold uppercase tracking-wide">Servis AC</span>
                        <span className="text-[10px] lg:text-xs text-gray-400 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            10 mnt lalu
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Customer${i}`} alt="Cust" className="w-full h-full object-cover"/>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm lg:text-base text-gray-900 leading-tight">Ibu Ratna Sari</h3>
                            <p className="text-xs text-gray-500 truncate max-w-[150px]">Jl. Melati No. 45, Jakarta Selatan</p>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-2 pt-4 border-t border-gray-50">
                        <button className="flex-1 bg-blue-600 text-white text-xs lg:text-sm font-bold py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-100">
                            Terima
                        </button>
                        <button className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs lg:text-sm font-bold text-gray-500 hover:bg-gray-50 hover:text-red-600 transition-colors">
                            Tolak
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </div>

    </div>
  );
}