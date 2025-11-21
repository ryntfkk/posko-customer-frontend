'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchMyOrders } from '@/features/orders/api'; // Pastikan fungsi ini ada di api.ts
import { Order } from '@/features/orders/types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await fetchMyOrders();
        // Backend mungkin mengembalikan { data: [...] } atau langsung array, sesuaikan
        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Gagal memuat pesanan:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        Memuat riwayat pesanan...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-gray-600 hover:text-red-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Riwayat Pesanan</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Belum ada pesanan aktif.</p>
            <Link href="/" className="text-red-600 font-bold hover:underline">Pesan Jasa Sekarang</Link>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${order.orderType === 'direct' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                    {order.orderType} Order
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  order.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                  order.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' :
                  'bg-gray-50 text-gray-600 border-gray-200'
                }`}>
                  {order.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-2 border-t border-gray-50 pt-3">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.quantity}x {item.name}</span>
                    <span className="font-medium">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-500">Total Bayar</span>
                <span className="text-lg font-bold text-red-600">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.totalAmount)}
                </span>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}