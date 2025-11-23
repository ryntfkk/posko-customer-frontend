// src/app/orders/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchMyOrders } from '@/features/orders/api';
import { Order } from '@/features/orders/types';

// --- HELPER UI ---
const getStatusBadge = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    paid: 'bg-blue-50 text-blue-700 border-blue-200',
    searching: 'bg-purple-50 text-purple-700 border-purple-200',
    accepted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    on_the_way: 'bg-orange-50 text-orange-700 border-orange-200',
    working: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    completed: 'bg-green-50 text-green-700 border-green-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
  };
  return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function OrderListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        // Menggunakan fetchMyOrders (GET /api/orders)
        const res = await fetchMyOrders();
        // Pastikan data berupa array, jika tidak fallback ke array kosong
        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Gagal memuat daftar pesanan:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-red-600"></div>
        <p className="text-sm text-gray-500 font-medium">Memuat riwayat pesanan...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 px-4 lg:px-8 py-4 mb-6">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-red-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Riwayat Pesanan</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 space-y-4">
        {orders.length === 0 ? (
          // Empty State
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 border-dashed">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Belum ada pesanan</h3>
            <p className="text-sm text-gray-500 mt-1 mb-6">Yuk, pesan layanan pertamamu sekarang!</p>
            <Link href="/" className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100">
              Cari Layanan
            </Link>
          </div>
        ) : (
          // Order List
          orders.map((order) => (
            <Link 
              href={`/orders/${order._id}`} 
              key={order._id}
              className="block bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-red-100 transition-all group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {order.orderType === 'direct' ? 'Direct Order' : 'Basic Order'}
                  </span>
                  <span className="text-xs text-gray-500 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusBadge(order.status)}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Icon Layanan (Ambil dari item pertama) */}
                <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center shrink-0">
                   {/* Jika backend sudah di-populate, kita bisa akses iconUrl. Jika belum, pakai placeholder */}
                   {order.items[0]?.serviceId?.iconUrl ? (
                      <Image 
                        src={order.items[0].serviceId.iconUrl} 
                        alt="Service" 
                        width={24} 
                        height={24} 
                        className="object-contain"
                      />
                   ) : (
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                   )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-red-600 transition-colors">
                    {order.items[0]?.name || 'Layanan Posko'}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">
                    {order.items.length > 1 ? `+ ${order.items.length - 1} item lainnya` : `${order.items[0]?.quantity} unit`}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-0.5">Total</p>
                  <p className="text-sm font-black text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </main>
    </div>
  );
}