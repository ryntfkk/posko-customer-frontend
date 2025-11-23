// src/app/orders/[orderId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/axios';
import { fetchOrderById, updateOrderStatus } from '@/features/orders/api';
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
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const isSnapLoaded = useMidtrans();

  const loadOrder = async () => {
    if (!orderId) return;
    try {
      const res = await fetchOrderById(orderId as string);
      setOrder(res.data); 
    } catch (error) {
      console.error('Gagal memuat detail pesanan:', error);
      router.push('/orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  // Handler Pembayaran (Existing)
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
            alert('Pembayaran Berhasil!');
            window.location.reload();
          },
          onPending: (result: any) => {
            alert('Menunggu pembayaran...');
            window.location.reload();
          },
          onError: (result: any) => {
            alert('Pembayaran Gagal. Silakan coba lagi.');
          },
          onClose: () => {
            console.log('Customer closed the popup');
          }
        });
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Terjadi kesalahan saat memproses pembayaran.");
    } finally {
      setIsPaying(false);
    }
  };

  // Handler Chat Mitra
  const handleChatMitra = async () => {
    const providerData = (order as any)?.providerId;
    const providerUser = providerData?.userId;
    const targetUserId = providerUser?._id || providerUser;
    
    if (!targetUserId) {
        alert("Data mitra belum tersedia atau pesanan belum diterima.");
        return;
    }

    setIsChatLoading(true);
    try {
        await api.post('/chat', { targetUserId });
        router.push('/chat');
    } catch (error) {
        alert("Gagal menghubungkan ke chat.");
    } finally {
        setIsChatLoading(false);
    }
  };

  // [FITUR BARU] Konfirmasi Penyelesaian Pesanan (Customer)
  const handleConfirmCompletion = async () => {
    if (!confirm("Apakah pekerjaan mitra sudah selesai dan sesuai dengan pesanan?")) return;
    
    setIsConfirming(true);
    try {
        // Ubah status jadi 'completed'
        await updateOrderStatus(orderId as string, 'completed');
        alert("Terima kasih! Pesanan telah selesai.");
        
        // Reload data untuk update UI
        loadOrder(); 
    } catch (error: any) {
        alert(error.response?.data?.message || "Gagal konfirmasi");
    } finally {
        setIsConfirming(false);
    }
  };

  // Badge Status UI
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-blue-100 text-blue-800',
      searching: 'bg-purple-100 text-purple-800',
      accepted: 'bg-indigo-100 text-indigo-800',
      on_the_way: 'bg-orange-100 text-orange-800',
      working: 'bg-cyan-100 text-cyan-800',
      waiting_approval: 'bg-yellow-100 text-yellow-800 border-yellow-200 animate-pulse', // Badge khusus
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    
    // Label khusus agar user paham
    const labels: Record<string, string> = {
        waiting_approval: 'Butuh Konfirmasi',
        on_the_way: 'Mitra Menuju Lokasi',
        searching: 'Mencari Mitra'
    };

    return {
        className: colors[status] || 'bg-gray-100 text-gray-800',
        label: labels[status] || status.replace(/_/g, ' ')
    };
  };

  if (isLoading || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const provider = (order as any).providerId;
  const providerUser = provider?.userId;
  const statusBadge = getStatusBadge(order.status);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 px-4 py-4 flex items-center gap-4">
        <Link href="/orders" className="text-gray-600 hover:text-red-600 p-1 rounded-full hover:bg-gray-100">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Detail Pesanan</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        {/* Alert Konfirmasi (Hanya jika waiting_approval) */}
        {order.status === 'waiting_approval' && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                <div className="bg-green-100 p-2 rounded-full text-green-600 shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                    <h3 className="font-bold text-green-800">Pekerjaan Selesai!</h3>
                    <p className="text-sm text-green-700 mt-1">Mitra telah menandai pekerjaan selesai. Mohon periksa hasil kerja dan tekan tombol <b>Konfirmasi Selesai</b> di bawah.</p>
                </div>
            </div>
        )}

        {/* Status Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">ID Pesanan</p>
              <p className="font-mono text-xs text-gray-400 select-all">{order._id}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-transparent ${statusBadge.className}`}>
              {statusBadge.label}
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
              
              <button 
                onClick={handleChatMitra}
                disabled={isChatLoading}
                className="ml-auto px-4 py-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isChatLoading ? '...' : (
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
                    <div className="w-10 h-10 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
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

        {/* Actions Sticky Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:static md:shadow-none md:border-0 md:bg-transparent md:p-0 z-30">
          <div className="max-w-3xl mx-auto space-y-3">
            
            {/* 1. Tombol Bayar (Pending) */}
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
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Memproses...
                  </>
                ) : (
                  'Lanjut Pembayaran'
                )}
              </button>
            )}

            {/* 2. Tombol Konfirmasi Selesai (Hanya muncul jika waiting_approval) */}
            {order.status === 'waiting_approval' && (
                <button 
                    onClick={handleConfirmCompletion}
                    disabled={isConfirming}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex justify-center items-center gap-2 active:scale-95"
                >
                    {isConfirming ? 'Memproses...' : '✅ Konfirmasi Selesai'}
                </button>
            )}
            
            {/* 3. Tombol Ulasan (Completed) */}
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