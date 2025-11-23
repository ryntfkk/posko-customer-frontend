// src/app/orders/[orderId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image'; // Import Image component
import api from '@/lib/axios'; // Import axios instance
import { fetchOrderById } from '@/features/orders/api';
import { createPayment } from '@/features/payments/api';
import { Order } from '@/features/orders/types';
import useMidtrans from '@/hooks/useMidtrans';

declare global {
  interface Window {
    snap: any;
  }
}

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const router = useRouter();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false); // State loading chat

  const isSnapLoaded = useMidtrans();

  useEffect(() => {
    if (!orderId) return;

    const loadOrder = async () => {
      try {
        const res = await fetchOrderById(orderId as string);
        setOrder(res.data); 
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

  const handlePayment = async () => {
    if (!isSnapLoaded) {
      alert("Sistem pembayaran sedang memuat. Silakan tunggu sebentar.");
      return;
    }

    setIsPaying(true);
    try {
      const res = await createPayment(orderId as string);
      const { snapToken } = res.data;

      if (window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: (result: any) => {
            console.log('Payment Success:', result);
            alert('Pembayaran Berhasil!');
            window.location.reload();
          },
          onPending: (result: any) => {
            console.log('Payment Pending:', result);
            alert('Menunggu pembayaran...');
            window.location.reload();
          },
          onError: (result: any) => {
            console.error('Payment Error:', result);
            alert('Pembayaran Gagal. Silakan coba lagi.');
          },
          onClose: () => {
            console.log('Customer closed the popup');
          }
        });
      }
    } catch (error: any) {
      console.error("Gagal memulai pembayaran:", error);
      alert(error.response?.data?.message || "Terjadi kesalahan saat memproses pembayaran.");
    } finally {
      setIsPaying(false);
    }
  };

  // [BARU] Handler untuk Chat Mitra
  const handleChatMitra = async () => {
    // Pastikan order dan provider ada
    // Note: Kita menggunakan 'any' casting sementara karena tipe Order di frontend mungkin belum update
    // dengan struktur populate (providerId berupa object, bukan string ID).
    const providerData = (order as any)?.providerId;
    
    if (!providerData || !providerData.userId) {
        alert("Data mitra tidak valid atau belum tersedia.");
        return;
    }

    setIsChatLoading(true);
    try {
        // 1. Request ke Backend untuk Buat/Get Room
        // Mengirim ID User milik Mitra (bukan ID Provider)
        const targetUserId = providerData.userId._id || providerData.userId;
        
        await api.post('/chat', { targetUserId });
        
        // 2. Redirect ke halaman Chat
        // Karena /chat di mobile/desktop sudah kita siapkan untuk load list room,
        // user akan melihat chat room teratas (yang baru saja di-update/dibuat)
        router.push('/chat');

    } catch (error) {
        console.error("Gagal membuka chat:", error);
        alert("Gagal menghubungkan ke chat.");
    } finally {
        setIsChatLoading(false);
    }
  };

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
      on_the_way: 'bg-orange-100 text-orange-800',
      working: 'bg-cyan-100 text-cyan-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Helper akses data provider yang dipopulate
  const provider = (order as any).providerId;
  const providerUser = provider?.userId;

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
              {order.status.replace(/_/g, ' ')}
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
        {provider && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fadeIn">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Informasi Mitra</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden border border-gray-100 relative">
                <Image 
                    src={providerUser?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${providerUser?.fullName || 'Mitra'}`}
                    alt="Mitra"
                    fill
                    className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{providerUser?.fullName || 'Mitra Posko'}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="text-yellow-500">★</span> {provider.rating?.toFixed(1) || '5.0'}
                    </p>
                    <span className="text-xs text-gray-300">•</span>
                    <p className="text-xs text-green-600 font-medium">Terverifikasi</p>
                </div>
              </div>
              
              {/* [Tombol Chat Diaktifkan] */}
              <button 
                onClick={handleChatMitra}
                disabled={isChatLoading}
                className="ml-auto px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-bold hover:bg-green-100 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChatLoading ? (
                    <>
                        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        Chat
                    </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Rincian Layanan</h3>
          <div className="space-y-4">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-start pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="flex items-start gap-3">
                    {/* Icon Service (jika ada) */}
                    <div className="w-10 h-10 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center shrink-0">
                        {item.serviceId?.iconUrl ? (
                            <Image src={item.serviceId.iconUrl} alt="Svc" width={20} height={20} className="object-contain opacity-70"/>
                        ) : (
                            <span className="text-[10px] font-bold text-gray-400">SVC</span>
                        )}
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.quantity} x {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price)}</p>
                        {item.note && <p className="text-xs text-gray-400 mt-1 italic bg-gray-50 p-1.5 rounded">Note: {item.note}</p>}
                    </div>
                </div>
                <p className="font-bold text-gray-900 text-sm">
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
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200 shadow-lg md:static md:shadow-none md:border-0 md:bg-transparent md:p-0 z-20">
          <div className="max-w-3xl mx-auto">
            {order.status === 'pending' && (
              <button 
                onClick={handlePayment}
                disabled={isPaying}
                className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-red-200 transition-all flex justify-center items-center gap-2 ${
                  isPaying 
                    ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                    : 'bg-red-600 hover:bg-red-700 hover:-translate-y-1'
                }`}
              >
                {isPaying ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memproses...
                  </>
                ) : (
                  'Lanjut Pembayaran'
                )}
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