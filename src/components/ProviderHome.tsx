// src/components/ProviderHome.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User } from '@/features/auth/types';

// --- ICONS (SVG) ---
const BellIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>;
const WalletIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>;
const StarIcon = () => <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>;
const LocationIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
const SettingsIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;

interface ProviderHomeProps {
  user: User;
}

export default function ProviderHome({ user }: ProviderHomeProps) {
  // --- STATE ---
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'incoming' | 'active' | 'history'>('incoming');

  // --- MOCK DATA (Nanti diganti fetch dari API) ---
  const earnings = 1250000;
  const totalJobs = 24;
  const rating = 4.8;

  const incomingOrders = [
    { id: 1, name: 'Budi Santoso', service: 'Cuci AC Split', distance: '2.3 km', price: 75000, address: 'Jl. Merdeka No. 10' },
    { id: 2, name: 'Siti Aminah', service: 'Isi Freon R32', distance: '4.1 km', price: 150000, address: 'Perum Griya Indah Blok A' },
  ];

  const activeOrders = [
    { id: 3, name: 'Rudi Hartono', service: 'Service Besar Motor', status: 'Menuju Lokasi', price: 200000, address: 'Bengkel Mandiri, Jl. Ahmad Yani' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24 lg:pb-10">
      
      {/* --- 1. NAVBAR KHUSUS MITRA (Header) --- */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8">
               <Image src="/logo.png" alt="Posko" fill className="object-contain"/>
            </div>
            <div>
                <h1 className="text-lg font-extrabold text-gray-900 leading-none">Mitra<span className="text-red-600">Posko</span></h1>
                <p className="text-[10px] text-gray-500 font-medium">Dashboard Profesional</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-gray-100 relative text-gray-600">
               <BellIcon />
               <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-600 border-2 border-white rounded-full"></span>
            </button>
            <Link href="/profile" className="hidden lg:block">
                <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
                    <img src={user.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.fullName}`} className="w-full h-full object-cover" alt="Profile"/>
                </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        {/* --- 2. HERO SECTION (Status & Saldo) --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card Status Online */}
            <div className="lg:col-span-2 bg-gradient-to-r from-red-700 to-red-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-red-100">
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl lg:text-3xl font-bold mb-1">Halo, {user.fullName.split(' ')[0]}! 👋</h2>
                            <p className="text-red-100 text-sm lg:text-base opacity-90">Siap menerima pesanan hari ini?</p>
                        </div>
                        {/* Toggle Switch Online */}
                        <div className="flex items-center bg-black/20 rounded-full p-1 backdrop-blur-sm border border-white/10">
                            <button 
                                onClick={() => setIsOnline(false)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${!isOnline ? 'bg-white text-red-700 shadow-sm' : 'text-red-200 hover:text-white'}`}
                            >
                                Offline
                            </button>
                            <button 
                                onClick={() => setIsOnline(true)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${isOnline ? 'bg-green-500 text-white shadow-sm shadow-green-900/20' : 'text-red-200 hover:text-white'}`}
                            >
                                <span className={`w-2 h-2 rounded-full bg-white ${isOnline ? 'animate-pulse' : ''}`}></span> Online
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-3 gap-4 divide-x divide-red-600/30">
                        <div className="pr-4">
                            <p className="text-xs text-red-200 mb-1">Rating</p>
                            <div className="flex items-center gap-1 text-lg lg:text-2xl font-bold">
                                {rating} <StarIcon />
                            </div>
                        </div>
                        <div className="px-4">
                            <p className="text-xs text-red-200 mb-1">Selesai</p>
                            <p className="text-lg lg:text-2xl font-bold">{totalJobs} Job</p>
                        </div>
                        <div className="pl-4">
                            <p className="text-xs text-red-200 mb-1">Performa</p>
                            <p className="text-lg lg:text-2xl font-bold text-green-300">98%</p>
                        </div>
                    </div>
                </div>
                {/* Decoration */}
                <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* Card Saldo (Dompet) */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-4 text-gray-500">
                        <div className="p-2 bg-gray-100 rounded-lg"><WalletIcon /></div>
                        <span className="text-xs font-bold uppercase tracking-wide">Dompet Mitra</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900 mb-1">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(earnings)}
                    </p>
                    <p className="text-xs text-gray-400">Pendapatan bersih minggu ini</p>
                </div>
                <button className="w-full mt-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200">
                    Tarik Dana
                </button>
            </div>
        </section>

        {/* --- 3. MANAGEMENT SECTION (Tabs) --- */}
        <section>
            {/* Tab Navigation */}
            <div className="flex gap-6 border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
                {[
                    { id: 'incoming', label: 'Pesanan Baru', count: incomingOrders.length },
                    { id: 'active', label: 'Berlangsung', count: activeOrders.length },
                    { id: 'history', label: 'Riwayat', count: 0 }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`pb-3 text-sm font-bold whitespace-nowrap transition-all relative ${
                            activeTab === tab.id ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${
                                activeTab === tab.id ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                            }`}>
                                {tab.count}
                            </span>
                        )}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 rounded-t-full"></div>
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[300px]">
                {/* STATE: Pesanan Baru */}
                {activeTab === 'incoming' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {!isOnline ? (
                            <div className="col-span-full py-12 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400 text-2xl">😴</div>
                                <h3 className="font-bold text-gray-900">Anda sedang Offline</h3>
                                <p className="text-sm text-gray-500 mt-1">Aktifkan status Online untuk menerima pesanan.</p>
                                <button onClick={() => setIsOnline(true)} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-full text-sm font-bold hover:bg-red-700 transition-colors">Online Sekarang</button>
                            </div>
                        ) : incomingOrders.length === 0 ? (
                            <div className="col-span-full py-12 text-center">
                                <p className="text-gray-500">Belum ada pesanan masuk saat ini.</p>
                            </div>
                        ) : (
                            incomingOrders.map((order) => (
                                <div key={order.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">{order.service}</span>
                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                            Rp {order.price.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${order.name}`} alt="Cust" className="w-full h-full object-cover"/>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 leading-tight">{order.name}</h3>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <LocationIcon /> {order.distance} • {order.address}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-50">
                                        <button className="py-2.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                                            Tolak
                                        </button>
                                        <button className="py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-200">
                                            Terima
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* STATE: Berlangsung */}
                {activeTab === 'active' && (
                    <div className="space-y-4">
                        {activeOrders.map((order) => (
                            <div key={order.id} className="bg-white p-6 rounded-2xl border-l-4 border-red-600 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                        <span className="text-xs font-bold text-green-600 uppercase">{order.status}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">{order.service}</h3>
                                    <p className="text-sm text-gray-500">Pelanggan: {order.name}</p>
                                    <p className="text-xs text-gray-400 mt-1">{order.address}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">
                                        Chat
                                    </button>
                                    <button className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-black shadow-lg">
                                        Selesaikan Pesanan
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* STATE: Riwayat */}
                {activeTab === 'history' && (
                    <div className="py-12 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
                        <p className="text-gray-400 text-sm">Riwayat pesanan akan muncul di sini.</p>
                    </div>
                )}
            </div>
        </section>

      </div>

      {/* --- 4. MOBILE BOTTOM NAV KHUSUS MITRA --- */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-40">
         <button className="flex flex-col items-center gap-1 text-red-600">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            <span className="text-[10px] font-bold">Beranda</span>
         </button>
         <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-red-600">
            <WalletIcon />
            <span className="text-[10px] font-medium">Dompet</span>
         </button>
         <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-red-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            <span className="text-[10px] font-medium">Layanan</span>
         </button>
         <Link href="/profile" className="flex flex-col items-center gap-1 text-gray-400 hover:text-red-600">
            <SettingsIcon />
            <span className="text-[10px] font-medium">Akun</span>
         </Link>
      </div>

    </div>
  );
}