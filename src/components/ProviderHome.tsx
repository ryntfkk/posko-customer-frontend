'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User } from '@/features/auth/types';
import { fetchIncomingOrders, acceptOrder, fetchMyOrders } from '@/features/orders/api';
import { Order } from '@/features/orders/types';
// [BARU] Import Navigasi Provider yang sudah dibuat
import ProviderBottomNav from '@/components/provider/ProviderBottomNav';

// --- ICONS ---
const WalletIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>;
const StarIcon = () => <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>;
const LocationIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;

interface ProviderHomeProps {
  user: User;
}

export default function ProviderHome({ user }: ProviderHomeProps) {
  // State
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'incoming' | 'active' | 'history'>('incoming');
  
  // Data State
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([]);
  const [myJobs, setMyJobs] = useState<Order[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 1. Load Provider Profile (untuk Rating & Stats) & My Jobs
  useEffect(() => {
    const initData = async () => {
        try {
            const jobsRes = await fetchMyOrders('provider');
            setMyJobs(Array.isArray(jobsRes.data) ? jobsRes.data : []);

            const incomingRes = await fetchIncomingOrders();
            setIncomingOrders(Array.isArray(incomingRes.data) ? incomingRes.data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    initData();
  }, []);

  // 2. Derived Stats (Hitung Data Asli)
  const activeJobs = useMemo(() => {
    return myJobs.filter(o => ['accepted', 'on_the_way', 'working', 'waiting_approval'].includes(o.status));
  }, [myJobs]);

  const historyJobs = useMemo(() => {
    return myJobs.filter(o => ['completed', 'cancelled', 'failed'].includes(o.status));
  }, [myJobs]);

  const completedCount = useMemo(() => {
    return myJobs.filter(o => o.status === 'completed').length;
  }, [myJobs]);

  // Hitung pendapatan dari order yang selesai
  const totalEarnings = useMemo(() => {
    return myJobs
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [myJobs]);

  // Rating Mockup (Karna belum ada endpoint getMyProviderProfile yang mudah)
  const rating = 5.0; 

  // Handle Terima Order
  const handleAccept = async (orderId: string) => {
    if (!confirm('Ambil pesanan ini?')) return;
    setProcessingId(orderId);
    try {
      await acceptOrder(orderId);
      alert('Pesanan diterima! Cek tab Berlangsung.');
      
      // Refresh Data
      const incRes = await fetchIncomingOrders();
      setIncomingOrders(incRes.data);
      
      const jobsRes = await fetchMyOrders('provider');
      setMyJobs(jobsRes.data);
      
      setActiveTab('active');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal terima order');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24 lg:pb-10">
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8">
               <Image src="/logo.png" alt="Posko" fill className="object-contain"/>
            </div>
            <div>
                <h1 className="text-lg font-extrabold text-gray-900 leading-none">Mitra<span className="text-red-600">Posko</span></h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/profile">
                <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
                    <Image 
                        src={user.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.fullName}`} 
                        width={36} height={36} 
                        className="w-full h-full object-cover" alt="Profile"
                    />
                </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        {/* HERO DASHBOARD */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card Status */}
            <div className="lg:col-span-2 bg-gradient-to-r from-red-700 to-red-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-red-100">
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl lg:text-3xl font-bold mb-1">Halo, {user.fullName.split(' ')[0]}! 👋</h2>
                            <p className="text-red-100 text-sm lg:text-base opacity-90">Pantau performa dan pesananmu.</p>
                        </div>
                        {/* Online Switch */}
                        <div className="flex items-center bg-black/20 rounded-full p-1 backdrop-blur-sm border border-white/10">
                            <button onClick={() => setIsOnline(false)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${!isOnline ? 'bg-white text-red-700' : 'text-red-200'}`}>Off</button>
                            <button onClick={() => setIsOnline(true)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${isOnline ? 'bg-green-500 text-white' : 'text-red-200'}`}>
                                <span className={`w-2 h-2 rounded-full bg-white ${isOnline ? 'animate-pulse' : ''}`}></span> On
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-3 gap-4 divide-x divide-red-600/30">
                        <div className="pr-4">
                            <p className="text-xs text-red-200 mb-1">Rating</p>
                            <div className="flex items-center gap-1 text-lg lg:text-2xl font-bold">{rating} <StarIcon /></div>
                        </div>
                        <div className="px-4">
                            <p className="text-xs text-red-200 mb-1">Selesai</p>
                            <p className="text-lg lg:text-2xl font-bold">{completedCount} Job</p>
                        </div>
                        <div className="pl-4">
                            <p className="text-xs text-red-200 mb-1">Saldo</p>
                            {/* [FIX] Pastikan user.balance ada atau default 0 */}
                            <p className="text-lg lg:text-xl font-bold">Rp {new Intl.NumberFormat('id-ID').format(user.balance || 0)}</p>
                        </div>
                    </div>
                </div>
                <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* Card Pendapatan Real */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-4 text-gray-500">
                        <div className="p-2 bg-gray-100 rounded-lg"><WalletIcon /></div>
                        <span className="text-xs font-bold uppercase tracking-wide">Total Pendapatan</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900 mb-1">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalEarnings)}
                    </p>
                    <p className="text-xs text-gray-400">Akumulasi dari pesanan selesai</p>
                </div>
                <button className="w-full mt-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors">
                    Riwayat Transaksi
                </button>
            </div>
        </section>

        {/* MAIN TABS */}
        <section>
            <div className="flex gap-6 border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('incoming')} className={`pb-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'incoming' ? 'text-red-600 border-red-600' : 'text-gray-400 border-transparent'}`}>
                    Masuk <span className="ml-1 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px]">{incomingOrders.length}</span>
                </button>
                <button onClick={() => setActiveTab('active')} className={`pb-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'active' ? 'text-red-600 border-red-600' : 'text-gray-400 border-transparent'}`}>
                    Berlangsung <span className="ml-1 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[10px]">{activeJobs.length}</span>
                </button>
                <button onClick={() => setActiveTab('history')} className={`pb-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'history' ? 'text-red-600 border-red-600' : 'text-gray-400 border-transparent'}`}>
                    Riwayat
                </button>
            </div>

            {/* --- CONTENT: ORDER MASUK --- */}
            {activeTab === 'incoming' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {incomingOrders.length === 0 ? (
                        <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
                            <p className="text-gray-400">Belum ada pesanan masuk.</p>
                        </div>
                    ) : (
                        incomingOrders.map((order) => (
                            <div key={order._id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                                {order.orderType === 'direct' && <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold">DIRECT</div>}
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold uppercase line-clamp-1">
                                        {order.items[0]?.name} {order.items.length > 1 && `+${order.items.length-1}`}
                                    </span>
                                    <span className="text-xs font-bold text-green-600">Rp {new Intl.NumberFormat('id-ID').format(order.totalAmount)}</span>
                                </div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0">
                                        {/* @ts-ignore */}
                                        <Image src={order.userId?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${order.userId?.fullName}`} width={40} height={40} alt="Cust" className="object-cover"/>
                                    </div>
                                    <div>
                                        {/* @ts-ignore */}
                                        <h3 className="font-bold text-gray-900 text-sm">{order.userId?.fullName}</h3>
                                        {/* @ts-ignore */}
                                        <p className="text-xs text-gray-500 flex items-center gap-1"><LocationIcon /> {order.userId?.address?.city || 'Lokasi...'}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleAccept(order._id)} disabled={!!processingId} className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 transition-colors shadow-lg shadow-red-100">
                                    {processingId === order._id ? '...' : 'Terima Order'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* --- CONTENT: ORDER BERLANGSUNG --- */}
            {activeTab === 'active' && (
                <div className="space-y-4">
                    {activeJobs.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">Tidak ada pekerjaan aktif.</div>
                    ) : (
                        activeJobs.map((order) => (
                            <Link href={`/provider/jobs/${order._id}`} key={order._id} className="block bg-white p-5 rounded-2xl border-l-4 border-blue-600 shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                                            <span className="text-xs font-bold text-blue-700 uppercase">{order.status.replace(/_/g, ' ')}</span>
                                        </div>
                                        <h3 className="text-base font-bold text-gray-900">{order.items[0].name}</h3>
                                        {/* @ts-ignore */}
                                        <p className="text-sm text-gray-500 mt-1">{order.userId?.fullName} • {order.userId?.address?.city}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-gray-900">Rp {new Intl.NumberFormat('id-ID').format(order.totalAmount)}</p>
                                        <span className="text-xs text-gray-400 font-mono">#{order._id.slice(-4)}</span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            )}

            {/* --- CONTENT: RIWAYAT --- */}
            {activeTab === 'history' && (
                <div className="space-y-3">
                    {historyJobs.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">Belum ada riwayat pekerjaan.</div>
                    ) : (
                        historyJobs.map((order) => (
                            <div key={order._id} className="flex justify-between items-center p-4 bg-white rounded-xl border border-gray-100">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">{order.items[0].name}</h4>
                                    <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('id-ID')}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {order.status}
                                    </span>
                                    <p className="text-xs font-bold text-gray-700 mt-1">Rp {new Intl.NumberFormat('id-ID').format(order.totalAmount)}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

        </section>
      </div>

      {/* [FIX] NAVIGASI BOTTOM (Menggunakan Component, bukan Hardcoded) */}
      <ProviderBottomNav />
    </div>
  );
}