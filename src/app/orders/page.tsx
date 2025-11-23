'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchMyOrders } from '@/features/orders/api';
import { Order } from '@/features/orders/types';

export default function OrderListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        // Mengambil daftar order khusus view 'customer'
        const res = await fetchMyOrders('customer');
        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Gagal memuat riwayat pesanan:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  // Helper untuk warna badge status
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      paid: 'bg-blue-100 text-blue-800 border-blue-200',
      searching: 'bg-purple-100 text-purple-800 border-purple-200',
      accepted: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      on_the_way: 'bg-orange-100 text-orange-800 border-orange-200',
      working: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      waiting_approval: 'bg-pink-100 text-pink-800 border-pink-200 animate-pulse',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Helper format status agar lebih mudah dibaca
  const formatStatus = (status: string) => {
    const labels: Record<string, string> = {
        waiting_approval: 'Butuh Konfirmasi',
        on_the_way: 'Mitra Menuju Lokasi',
        searching: 'Mencari Mitra'
    };
    return labels[status] || status.replace(/_/g, ' ');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="text-sm text-gray-500">Memuat riwayat pesanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-red-600 p-1 rounded-full hover:bg-gray-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <h1 className="text-lg font-bold text-gray-900">Pesanan Saya</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Belum ada pesanan</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">Anda belum memesan layanan apapun. Yuk cari teknisi sekarang!</p>
            <Link href="/" className="mt-6 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200">
                Cari Layanan
            </Link>
          </div>
        ) : (
          orders.map((order) => {
            // Handling casting untuk properti populate
            const providerData = (order as any).providerId;
            const providerUser = providerData?.userId;
            
            return (
                <Link href={`/orders/${order._id}`} key={order._id} className="block bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-red-100 transition-all group">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-mono">#{order._id.slice(-6).toUpperCase()}</span>
                        <span className="text-xs text-gray-500 mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                        {formatStatus(order.status)}
                    </span>
                </div>

                {/* Service Info */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {order.items[0]?.serviceId?.iconUrl ? (
                             <Image src={order.items[0].serviceId.iconUrl} alt="Icon" width={24} height={24} className="object-contain opacity-80" />
                        ) : (
                            <span className="text-[10px] font-bold text-gray-400">SVC</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate group-hover:text-red-600 transition-colors">
                            {order.items[0]?.name}
                            {order.items.length > 1 && <span className="text-gray-400 font-normal text-xs ml-1">+{order.items.length - 1} lainnya</span>}
                        </h3>
                        {/* Tampilkan nama Provider jika sudah accepted, jika belum tampilkan tipe order */}
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {providerUser ? `Mitra: ${providerUser.fullName}` : (order.orderType === 'direct' ? 'Direct Order' : 'Pencarian Mitra Otomatis')}
                        </p>
                    </div>
                </div>

                <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                    <p className="text-xs text-gray-500">Total Pembayaran</p>
                    <p className="text-sm font-black text-gray-900">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.totalAmount)}
                    </p>
                </div>
                </Link>
            );
          })
        )}
      </main>
    </div>
  );
}