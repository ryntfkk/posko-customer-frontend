'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchOrderById } from '@/features/orders/api';
import { Order } from '@/features/orders/types';

export default function OrderDetailPage() {
  const { orderId } = useParams(); // Ambil ID dari URL
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const loadOrder = async () => {
      try {
        const res = await fetchOrderById(orderId as string);
        setOrder(res.data); // API mengembalikan { message, data: { ... } }
      } catch (error) {
        console.error('Gagal memuat detail pesanan:', error);
        alert('Pesanan tidak ditemukan');
        router.push('/orders');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [orderId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!order) return null;

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-blue-100 text-blue-800',
      searching: 'bg-purple-100 text-purple-800',
      accepted: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 px-4 py-4 flex items-center gap-4">
        <Link href="/orders" className="text-gray-600 hover:text-red-600 p-1 rounded-full hover:bg-gray-100">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Detail Pesanan</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Status Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">ID Pesanan</p>
              <p className="font-mono text-xs text-gray-400 select-all">{order._id}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadge(order.status)}`}>
              {order.status}
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">Tanggal Pemesanan</p>
            <p className="font-medium text-gray-900">
              {new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
            </p>
          </div>
        </div>

        {/* Provider Info (Jika sudah accepted) */}
        {order.providerId && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Informasi Mitra</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                {/* Placeholder Avatar */}
                <svg className="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <div>
                {/* Note: Sesuaikan field ini dengan hasil populate di backend */}
                <p className="font-bold text-gray-900">Mitra Posko</p>
                <p className="text-sm text-green-600">Terverifikasi</p>
              </div>
              <button className="ml-auto px-4 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-bold hover:bg-green-100">
                Chat Mitra
              </button>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Rincian Layanan</h3>
          <div className="space-y-4">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.quantity} x {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price)}</p>
                  {item.note && <p className="text-xs text-gray-400 mt-1 italic">Catatan: {item.note}</p>}
                </div>
                <p className="font-bold text-gray-900">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Total Pembayaran</span>
            <span className="text-xl font-black text-red-600">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200 shadow-lg md:static md:shadow-none md:border-0 md:bg-transparent md:p-0">
          <div className="max-w-3xl mx-auto">
            {order.status === 'pending' && (
              <button className="w-full py-3.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all">
                Lanjut Pembayaran
              </button>
            )}
            {order.status === 'completed' && (
              <button className="w-full py-3.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all">
                Beri Ulasan
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}