'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchIncomingOrders, acceptOrder } from '@/features/orders/api';
import { Order } from '@/features/orders/types';

export default function ProviderDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      const res = await fetchIncomingOrders();
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Gagal memuat order masuk:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleAccept = async (orderId: string) => {
    if (!confirm('Apakah Anda yakin ingin mengambil pesanan ini?')) return;
    
    setProcessingId(orderId);
    try {
      await acceptOrder(orderId);
      alert('Pesanan berhasil diterima! Silakan cek menu "Pekerjaan Saya".');
      loadOrders(); // Refresh list setelah terima
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menerima pesanan');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex justify-center items-center bg-gray-50">Memuat pesanan masuk...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">Order Masuk</h1>
        <p className="text-xs text-gray-500">Ambil pesanan yang sesuai dengan keahlianmu</p>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center text-gray-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            </div>
            <p className="text-gray-500">Belum ada orderan masuk saat ini.</p>
            <button onClick={loadOrders} className="mt-4 text-red-600 font-bold hover:underline">Refresh</button>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              {/* Header Card */}
              <div className="flex justify-between items-start mb-3">
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${order.orderType === 'direct' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                  {order.orderType === 'direct' ? 'Langsung Untukmu' : 'Basic Order'}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </div>

              {/* Customer Info (Hidden detail for privacy until accepted usually, but let's show basic info) */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                   {/* Placeholder Avatar */}
                   <svg className="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <div>
                  {/* @ts-ignore: Populate result check */}
                  <p className="font-bold text-gray-900">{order.userId?.fullName || 'Pelanggan'}</p>
                  {/* @ts-ignore */}
                  <p className="text-xs text-gray-500">{order.userId?.address?.city || 'Lokasi disembunyikan'}</p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2 bg-gray-50 p-3 rounded-xl mb-4">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-700 font-medium">{item.quantity}x {item.name}</span>
                  </div>
                ))}
              </div>

              {/* Footer Action */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-xs text-gray-500">Potensi Pendapatan</p>
                  <p className="text-lg font-bold text-green-600">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.totalAmount)}
                  </p>
                </div>
                
                {order.status === 'searching' || order.status === 'pending' ? (
                  <button 
                    onClick={() => handleAccept(order._id)}
                    disabled={!!processingId}
                    className="px-6 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all disabled:bg-gray-300 disabled:shadow-none"
                  >
                    {processingId === order._id ? 'Memproses...' : 'Terima Order'}
                  </button>
                ) : (
                  <button className="px-6 py-2.5 bg-gray-100 text-gray-500 text-sm font-bold rounded-xl cursor-default">
                    {order.status === 'accepted' ? 'Diterima' : order.status}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}