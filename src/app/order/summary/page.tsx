// src/app/order/summary/page.tsx
'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

import { useCart, getCartItemId } from '@/features/cart/useCart';
import { createOrder } from '@/features/orders/api';
import { fetchProviderById } from '@/features/providers/api';
import { CreateOrderPayload } from '@/features/orders/types';
import { Provider } from '@/features/auth/types';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

function OrderSummaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, clearCart, isHydrated } = useCart();

  // State
  const [provider, setProvider] = useState<Provider | null>(null);
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState({
    province: '',
    city: '',
    district: '',
    detail: '',
  });
  const [location, setLocation] = useState({ type: 'Point' as const, coordinates: [0, 0] as [number, number] });
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProvider, setIsLoadingProvider] = useState(false);

  // Parse query params
  const orderTypeParam = (searchParams?.get('type') || 'basic') as 'basic' | 'direct';
  const providerIdParam = searchParams?.get('providerId');
  const categoryParam = searchParams?.get('category');

  // Filter active cart items
  const activeCartItems = useMemo(() => {
    return cart.filter((item) => {
      if (item.quantity <= 0) return false;
      
      if (orderTypeParam === 'basic') {
        if (item.orderType !== 'basic') return false;
        if (categoryParam) {
          return (item.category ?? null) === categoryParam;
        }
        return true;
      } else {
        return item.orderType === 'direct' && item.providerId === providerIdParam;
      }
    });
  }, [cart, orderTypeParam, providerIdParam, categoryParam]);

  const currentTotalAmount = activeCartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const currentTotalItems = activeCartItems.reduce((sum, item) => sum + item.quantity, 0);

  const estimatedDiscount = 0;
  const payableAmount = Math.max(currentTotalAmount - estimatedDiscount, 0);

  // =====================================================================
  // EFFECT 1: Load Provider Info (jika Direct Order)
  // =====================================================================
  useEffect(() => {
    if (orderTypeParam !== 'direct' || !providerIdParam) return;

    const loadProvider = async () => {
      try {
        setIsLoadingProvider(true);
        const res = await fetchProviderById(providerIdParam);
        // FIX: Handle potential array return type
        const providerData = Array.isArray(res.data) ? res.data[0] : res.data;
        setProvider(providerData);
      } catch (err) {
        console.error('Error loading provider:', err);
      } finally {
        setIsLoadingProvider(false);
      }
    };

    loadProvider();
  }, [orderTypeParam, providerIdParam]);

  // =====================================================================
  // EFFECT 2: Set Default Schedule Time (15 menit dari sekarang)
  // =====================================================================
  useEffect(() => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 15 * 60000);
    const isoString = futureDate.toISOString().slice(0, 16);
    setScheduledAt(isoString);
  }, []);

  // =====================================================================
  // EFFECT 3: Get User Current Location (jika ada)
  // =====================================================================
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({
            type: 'Point',
            coordinates: [longitude, latitude],
          });
        },
        (error) => {
          console.warn('Error getting location:', error);
        }
      );
    }
  }, []);

  // =====================================================================
  // VALIDATION LOGIC
  // =====================================================================
  const validateOrderData = (): boolean => {
    if (activeCartItems.length === 0) {
      setError('Pilih minimal satu layanan.');
      return false;
    }

    if (!scheduledAt) {
      setError('Pilih tanggal dan waktu kunjungan.');
      return false;
    }

    const scheduledDate = new Date(scheduledAt);
    const now = new Date();
    if (scheduledDate < now) {
      setError('Tanggal kunjungan tidak boleh di masa lalu.');
      return false;
    }

    if (!shippingAddress.province || !shippingAddress.city || !shippingAddress.detail) {
      setError('Lengkapi alamat kunjungan (provinsi, kota, detail).');
      return false;
    }

    if (!location.coordinates[0] || !location.coordinates[1]) {
      setError('Tentukan lokasi di peta atau gunakan lokasi saat ini.');
      return false;
    }

    setError(null);
    return true;
  };

  // =====================================================================
  // HANDLERS
  // =====================================================================
  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      setPromoMessage('Masukkan kode promo terlebih dahulu.');
      return;
    }
    setPromoMessage('Kode promo diterapkan secara otomatis jika valid.');
  };

  const handlePlaceOrderAndPay = async () => {
    if (!validateOrderData()) return;

    setIsSubmitting(true);
    try {
      const orderPayload: CreateOrderPayload = {
        orderType: orderTypeParam,
        providerId: orderTypeParam === 'direct' ? providerIdParam || null : null,
        totalAmount: payableAmount,
        items: activeCartItems.map(item => ({
          serviceId: item.serviceId,
          name: item.serviceName,
          quantity: item.quantity,
          price: item.pricePerUnit,
          note: ''
        })),
        scheduledAt: new Date(scheduledAt).toISOString(),
        shippingAddress: {
          province: shippingAddress.province,
          city: shippingAddress.city,
          district: shippingAddress.district || '',
          detail: shippingAddress.detail,
        },
        location: {
          type: 'Point',
          coordinates: [location.coordinates[0], location.coordinates[1]]
        }
      };

      const response = await createOrder(orderPayload);
      
      if (response.data && response.data._id) {
        const orderId = response.data._id;
        clearCart();
        router.push(`/payment?orderId=${orderId}`);
      } else {
        setError('Gagal membuat pesanan. Silakan coba lagi.');
      }
    } catch (err: any) {
      console.error('Error creating order:', err);
      const errorMessage = err.response?.data?.message || 'Gagal membuat pesanan. Silakan coba lagi.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (activeCartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <svg className="w-20 h-20 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Keranjang Kosong</h2>
        <p className="text-gray-600 mb-6">Silakan kembali ke checkout untuk memilih layanan.</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
        >
          Kembali ke Checkout
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-red-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Ringkasan Pesanan</span>
            <h1 className="text-xl font-bold text-gray-900">Konfirmasi Pesanan</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 lg:px-8 py-8 space-y-6">
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl font-medium">
            {error}
          </div>
        )}

        {/* Info Provider (Direct Order) */}
        {orderTypeParam === 'direct' && (
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Informasi Mitra</h2>
            {isLoadingProvider ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
              </div>
            ) : provider ? (
              <div className="flex items-start gap-4">
                <Image
                  src={provider.userId.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider.userId.fullName}`}
                  alt={provider.userId.fullName}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{provider.userId.fullName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-yellow-500">★</span>
                    <span className="text-sm font-bold text-gray-700">{provider.rating ? provider.rating.toFixed(1) : 'New'}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{provider.userId.bio}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Mitra tidak ditemukan.</p>
            )}
          </section>
        )}

        {/* Jadwal Kunjungan */}
        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Jadwal Kunjungan</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tanggal & Waktu Kunjungan
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => {
                  setScheduledAt(e.target.value);
                  setError(null);
                }}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
              <p className="text-xs text-gray-500 mt-1">Minimal 15 menit dari sekarang</p>
            </div>
          </div>
        </section>

        {/* Alamat Kunjungan */}
        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Alamat Kunjungan</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Provinsi</label>
                <input
                  type="text"
                  placeholder="Jawa Barat"
                  value={shippingAddress.province}
                  onChange={(e) => setShippingAddress({...shippingAddress, province: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Kota/Kabupaten</label>
                <input
                  type="text"
                  placeholder="Bandung"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Kecamatan</label>
              <input
                type="text"
                placeholder="Cibiru"
                value={shippingAddress.district}
                onChange={(e) => setShippingAddress({...shippingAddress, district: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Detail Alamat</label>
              <textarea
                placeholder="Jl. Merdeka No. 10, Apt 2B"
                value={shippingAddress.detail}
                onChange={(e) => setShippingAddress({...shippingAddress, detail: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700 font-medium">
                ℹ️ Lokasi otomatis diambil dari GPS perangkat Anda. Koordinat: [{location.coordinates[0].toFixed(4)}, {location.coordinates[1].toFixed(4)}]
              </p>
            </div>
          </div>
        </section>

        {/* Items Summary */}
        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Detail Layanan</h2>
          <div className="space-y-3">
            {activeCartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-start pb-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-semibold text-gray-900">{item.serviceName}</p>
                  <p className="text-xs text-gray-500">{item.quantity}x @ {formatCurrency(item.pricePerUnit)}</p>
                </div>
                <p className="font-bold text-gray-900">{formatCurrency(item.totalPrice)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Promo Code */}
        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Kode Promo (Opsional)</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Masukkan kode promo"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value);
                setPromoMessage('');
              }}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
            <button
              onClick={handleApplyPromo}
              className="px-6 py-3 bg-gray-200 text-gray-900 font-bold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Gunakan
            </button>
          </div>
          {promoMessage && (
            <p className="text-xs text-green-600 mt-2">{promoMessage}</p>
          )}
        </section>

        {/* Payment Summary */}
        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Ringkasan Pembayaran</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal ({currentTotalItems} item)</span>
              <span className="font-bold text-gray-900">{formatCurrency(currentTotalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Diskon</span>
              <span className="font-bold text-gray-900">-{formatCurrency(estimatedDiscount)}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="text-lg font-bold text-gray-900">Total Pembayaran</span>
              <span className="text-2xl font-black text-red-600">{formatCurrency(payableAmount)}</span>
            </div>
          </div>
        </section>

        {/* Checkout Button */}
        <button
          onClick={handlePlaceOrderAndPay}
          disabled={isSubmitting || !isHydrated}
          className={`w-full py-4 rounded-xl font-bold text-white text-lg flex justify-center items-center gap-2 transition-all ${
            isSubmitting || !isHydrated
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 active:scale-95'
          }`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Memproses...
            </>
          ) : (
            <>
              Lanjutkan ke Pembayaran
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </main>
    </div>
  );
}

export default function OrderSummaryPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>}>
      <OrderSummaryContent />
    </Suspense>
  );
}