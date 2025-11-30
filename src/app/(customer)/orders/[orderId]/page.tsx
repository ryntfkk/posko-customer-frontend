// src/app/(customer)/orders/[orderId]/page.tsx
'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { fetchOrderById, updateOrderStatus } from '@/features/orders/api';
import { createPayment } from '@/features/payments/api';
import { Order, OrderStatus } from '@/features/orders/types';
import useMidtrans from '@/hooks/useMidtrans';

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: {
        onSuccess?: (result: unknown) => void;
        onPending?: (result: unknown) => void;
        onError?: (result: unknown) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const { orderId } = use(params);
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const isSnapLoaded = useMidtrans();

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const res = await fetchOrderById(orderId);
        setOrder(res.data);
      } catch (error) {
        console.error('Gagal memuat order:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadOrder();
  }, [orderId]);

  const handlePayment = async () => {
    if (! isSnapLoaded) {
      alert("Sistem pembayaran sedang memuat. Silakan tunggu sebentar.");
      return;
    }

    setIsPaying(true);
    try {
      const res = await createPayment(orderId);
      const { snapToken } = res.data;

      if (window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: () => {
            alert('Pembayaran Berhasil!');
            window.location.reload();
          },
          onPending: () => {
            alert('Menunggu pembayaran...');
            window.location.reload();
          },
          onError: () => {
            alert('Pembayaran Gagal. Silakan coba lagi.');
          },
          onClose: () => {
            console.log('Popup ditutup');
          },
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Gagal memproses pembayaran.');
    } finally {
      setIsPaying(false);
    }
  };

  const handleConfirmComplete = async () => {
    if (!confirm('Konfirmasi bahwa pekerjaan telah selesai? ')) return;
    
    setIsConfirming(true);
    try {
      await updateOrderStatus(orderId, 'completed');
      alert('Pesanan dikonfirmasi selesai!');
      window.location.reload();
    } catch (error) {
      console.error('Confirm error:', error);
      alert('Gagal konfirmasi.');
    } finally {
      setIsConfirming(false);
    }
  };

  const getStatusConfig = (status: OrderStatus) => {
    const configs: Record<OrderStatus, { label: string; color: string; bgColor: string; icon: string }> = {
      pending: { label: 'Menunggu Pembayaran', color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200', icon: '⏳' },
      paid: { label: 'Dibayar', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200', icon: '💳' },
      searching: { label: 'Mencari Mitra', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200', icon: '🔍' },
      accepted: { label: 'Diterima Mitra', color: 'text-indigo-700', bgColor: 'bg-indigo-50 border-indigo-200', icon: '✅' },
      on_the_way: { label: 'Mitra Dalam Perjalanan', color: 'text-cyan-700', bgColor: 'bg-cyan-50 border-cyan-200', icon: '🚗' },
      working: { label: 'Sedang Dikerjakan', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200', icon: '🔧' },
      waiting_approval: { label: 'Menunggu Konfirmasi Anda', color: 'text-pink-700', bgColor: 'bg-pink-50 border-pink-200', icon: '👆' },
      completed: { label: 'Selesai', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200', icon: '🎉' },
      cancelled: { label: 'Dibatalkan', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200', icon: '❌' },
      failed: { label: 'Gagal', color: 'text-gray-700', bgColor: 'bg-gray-50 border-gray-200', icon: '⚠️' },
    };
    return configs[status] || configs.pending;
  };

  // Helper untuk format tipe properti
  const getPropertyTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      rumah: 'Rumah',
      apartemen: 'Apartemen',
      kantor: 'Kantor',
      ruko: 'Ruko',
      kendaraan: 'Kendaraan',
      lainnya: 'Lainnya'
    };
    return labels[type || ''] || '-';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="text-sm text-gray-500">Memuat detail pesanan...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8 text-center">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Pesanan Tidak Ditemukan</h2>
        <Link href="/orders" className="text-red-600 font-bold hover:underline">
          Kembali ke Daftar Pesanan
        </Link>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const providerData = typeof order.providerId === 'object' ? order.providerId : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 px-4 py-4 flex items-center gap-4">
        <Link href="/orders" className="text-gray-600 hover:text-red-600 p-1 rounded-full hover:bg-gray-100">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Detail Pesanan</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Status Card */}
        <div className={`p-6 rounded-2xl border ${statusConfig.bgColor}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{statusConfig.icon}</span>
            <div>
              <p className={`font-bold ${statusConfig.color}`}>{statusConfig.label}</p>
              {/* [BARU] Tampilkan Order Number */}
              <p className="text-xs text-gray-500 font-mono">
                Order: {order.orderNumber || `#${order._id.slice(-8).toUpperCase()}`}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Dibuat: {formatDate(order.createdAt)}</p>
          {order.scheduledAt && (
            <p className="text-sm text-gray-600">Jadwal: {formatDate(order.scheduledAt)}</p>
          )}
          {/* [BARU] Time Slot Preference */}
          {order.scheduledTimeSlot && (order.scheduledTimeSlot.preferredStart || order.scheduledTimeSlot.preferredEnd) && (
            <p className="text-sm text-gray-600">
              Preferensi Jam: {order.scheduledTimeSlot.preferredStart || '?'} - {order.scheduledTimeSlot.preferredEnd || '?'}
              {order.scheduledTimeSlot.isFlexible && <span className="text-xs text-gray-400 ml-1">(Fleksibel)</span>}
            </p>
          )}
        </div>

        {/* [BARU] Informasi Kontak Customer */}
        {order.customerContact && order.customerContact.phone && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center gap-2">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
              Kontak Customer
            </h3>
            <div className="space-y-2">
              {order.customerContact.name && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Nama Penerima</span>
                  <span className="text-sm font-medium text-gray-900">{order.customerContact.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">No. HP Utama</span>
                <a href={`tel:${order.customerContact.phone}`} className="text-sm font-medium text-blue-600 hover:underline">
                  {order.customerContact.phone}
                </a>
              </div>
              {order.customerContact.alternatePhone && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">No.HP Cadangan</span>
                  <a href={`tel:${order.customerContact.alternatePhone}`} className="text-sm font-medium text-blue-600 hover:underline">
                    {order.customerContact.alternatePhone}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Provider Info */}
        {providerData && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Mitra</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100">
                <Image
                  src={providerData.userId?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${providerData.userId?.fullName}`}
                  alt={providerData.userId?.fullName || 'Mitra'}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{providerData.userId?.fullName}</p>
                {providerData.userId?.phoneNumber && (
                  <a href={`tel:${providerData.userId.phoneNumber}`} className="text-sm text-blue-600 hover:underline">
                    {providerData.userId.phoneNumber}
                  </a>
                )}
                {providerData.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-yellow-500">★</span>
                    <span className="text-sm text-gray-600">{providerData.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <button className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Chat
              </button>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Rincian Layanan</h3>
          <div className="space-y-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center shrink-0">
                    {item.serviceId?.iconUrl ?  (
                      <Image src={item.serviceId.iconUrl} alt="Svc" width={20} height={20} className="object-contain opacity-70"/>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-400">SVC</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.quantity} x {formatCurrency(item.price)}</p>
                    {item.note && <p className="text-xs text-gray-400 mt-1 italic">Catatan: {item.note}</p>}
                  </div>
                </div>
                <p className="font-bold text-gray-900">{formatCurrency(item.quantity * item.price)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between">
            <span className="font-bold text-gray-900">Total</span>
            <span className="text-xl font-black text-red-600">{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>

        {/* Alamat */}
        {order.shippingAddress && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Alamat Pelayanan</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p className="font-semibold">{order.shippingAddress.city}, {order.shippingAddress.province}</p>
              <p>{order.shippingAddress.detail}</p>
              {order.shippingAddress.district && <p>Kec.{order.shippingAddress.district}</p>}
              {order.shippingAddress.village && <p>Kel.{order.shippingAddress.village}</p>}
              {order.shippingAddress.postalCode && <p>Kode Pos: {order.shippingAddress.postalCode}</p>}
            </div>
            {order.location && order.location.coordinates[0] !== 0 && (
              <a 
                href={`https://www.google.com/maps? q=${order.location.coordinates[1]},${order.location.coordinates[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Lihat di Google Maps
              </a>
            )}
          </div>
        )}

        {/* [BARU] Detail Properti */}
        {order.propertyDetails && order.propertyDetails.type && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
              Detail Properti
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Tipe</span>
                <p className="font-medium text-gray-900">{getPropertyTypeLabel(order.propertyDetails.type)}</p>
              </div>
              {order.propertyDetails.floor !== null && order.propertyDetails.floor !== undefined && (
                <div>
                  <span className="text-gray-500">Lantai</span>
                  <p className="font-medium text-gray-900">{order.propertyDetails.floor}</p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Parkir</span>
                <p className="font-medium text-gray-900">{order.propertyDetails.hasParking ? '✅ Ada' : '❌ Tidak ada'}</p>
              </div>
              <div>
                <span className="text-gray-500">Lift/Elevator</span>
                <p className="font-medium text-gray-900">{order.propertyDetails.hasElevator ? '✅ Ada' : '❌ Tidak ada'}</p>
              </div>
            </div>
            {order.propertyDetails.accessNote && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-500 uppercase">Catatan Akses</span>
                <p className="text-sm text-gray-700 mt-1">{order.propertyDetails.accessNote}</p>
              </div>
            )}
          </div>
        )}

        {/* [BARU] Catatan Order */}
        {order.orderNote && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Instruksi Khusus
            </h3>
            <p className="text-sm text-gray-700 bg-yellow-50 p-4 rounded-xl border border-yellow-100">
              {order.orderNote}
            </p>
          </div>
        )}

        {/* [BARU] Lampiran/Foto */}
        {order.attachments && order.attachments.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              Lampiran ({order.attachments.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {order.attachments.map((att, index) => (
                <a 
                  key={index} 
                  href={att.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100 hover:border-blue-400 transition-colors"
                >
                  <Image 
                    src={att.url} 
                    alt={att.description || `Lampiran ${index + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.png';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                    </svg>
                  </div>
                  {att.description && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                      {att.description}
                    </div>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {order.status === 'pending' && (
            <button
              onClick={handlePayment}
              disabled={isPaying}
              className="w-full py-3.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:bg-gray-400"
            >
              {isPaying ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Bayar Sekarang
                </>
              )}
            </button>
          )}

          {order.status === 'waiting_approval' && (
            <button
              onClick={handleConfirmComplete}
              disabled={isConfirming}
              className="w-full py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:bg-gray-400"
            >
              {isConfirming ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Konfirmasi Selesai
                </>
              )}
            </button>
          )}

          {order.status === 'completed' && (
            <button className="w-full py-3.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all">
              Beri Ulasan
            </button>
          )}
        </div>
      </main>
    </div>
  );
}