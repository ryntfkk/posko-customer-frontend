'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { fetchMyOrders } from '@/features/orders/api'; 
import { Order } from '@/features/orders/types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fungsi untuk mengambil data order
  const loadOrders = useCallback(async () => {
    try {
      const res = await fetchMyOrders();
      // Pastikan mengambil array dari res.data (karena struktur response { message, data: [...] })
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Gagal memuat pesanan:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Load saat pertama kali render
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Handle tombol refresh manual
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadOrders();
  };

  // Helper untuk warna status agar lebih informatif
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'settlement': // Midtrans status
      case 'paid':
      case 'accepted': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'working': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'completed': return 'bg-green-50 text-green-700 border-green-100';
      case 'cancelled':
      case 'deny': 
      case 'expire': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  // Tampilan saat Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500 font-medium">Memuat riwayat pesanan...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Header Fixed */}
      <header className="bg-white shadow-sm sticky top-0 z-20 px-4 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-red-600 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-50">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <h1 className="text-lg lg:text-xl font-bold text-gray-900">Riwayat Pesanan</h1>
        </div>
        
        {/* Tombol Refresh */}
        <button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className={`p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-all ${isRefreshing ? 'animate-spin text-red-600' : ''}`}
            title="Muat Ulang Data"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {orders.length === 0 ? (
          // Tampilan Jika Kosong
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            </div>
            <h3 className="text-gray-900 font-bold text-lg">Belum ada pesanan</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-xs">Layanan yang Anda pesan akan muncul di sini.</p>
            <Link href="/" className="px-6 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200">
                Pesan Jasa Sekarang
            </Link>
          </div>
        ) : (
          // List Pesanan
          orders.map((order) => (
            <Link key={order._id} href={`/orders/${order._id}`} className="block group">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden">
                
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wide ${order.orderType === 'direct' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                            {order.orderType}
                        </span>
                        <span className="text-[10px] text-gray-400">•</span>
                        <p className="text-xs text-gray-500 font-medium">
                            {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    {order.providerId && (
                        <p className="text-xs text-gray-800 font-bold flex items-center gap-1">
                            Mitra: <span className="font-normal text-gray-600">Terpilih</span>
                            <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                        </p>
                    )}
                    </div>
                    
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${getStatusColor(order.status)}`}>
                    {order.status}
                    </span>
                </div>

                {/* Items List */}
                <div className="space-y-2.5 border-t border-dashed border-gray-100 pt-3 mb-3">
                    {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm items-center">
                        <div className="flex items-center gap-3">
                            <span className="w-6 h-6 flex items-center justify-center bg-gray-50 rounded text-[10px] font-bold text-gray-500 border border-gray-200">
                                {item.quantity}x
                            </span>
                            <span className="text-gray-700 font-medium line-clamp-1">{item.name}</span>
                        </div>
                        <span className="text-gray-500 text-xs font-medium">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price)}
                        </span>
                    </div>
                    ))}
                </div>

                {/* Footer & Total */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Total Bayar</span>
                        <span className="text-lg font-black text-gray-900 group-hover:text-red-600 transition-colors">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.totalAmount)}
                        </span>
                    </div>
                    
                    {/* Indikator Chevron (Panah Kanan) */}
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </div>
                </div>
                </div>
            </Link>
          ))
        )}
      </main>
    </div>
  );
}