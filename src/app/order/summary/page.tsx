// src/app/order/summary/page.tsx
'use client';

import { useMemo, useState, Suspense, useEffect } from 'react'; // Import useEffect
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { useCart } from '@/features/cart/useCart';
import { createOrder } from '@/features/orders/api';
import { createPayment } from '@/features/payments/api'; 
import { CreateOrderPayload } from '@/features/orders/types';
import useMidtrans from '@/hooks/useMidtrans'; 
import { fetchProfile } from '@/features/auth/api'; // Import fetchProfile
import { User, Address } from '@/features/auth/types'; // Import User dan Address

declare global {
  interface Window {
    snap: any;
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// [PERBAIKAN] Pisahkan konten utama ke komponen terpisah agar bisa di-suspend
function OrderSummaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); 
  
  const { cart, clearCart, isHydrated } = useCart(); 
  
  const isSnapLoaded = useMidtrans();

  // State Data
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // State Form/Input
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  // [BARU] Pilih Alamat (default hanya satu)
  const [selectedAddress, setSelectedAddress] = useState<Address | undefined>(undefined);
  const [selectedLocation, setSelectedLocation] = useState<{ type: 'Point', coordinates: number[] } | undefined>(undefined);

  const orderTypeParam = searchParams.get('type') as 'basic' | 'direct' | null;
  const providerIdParam = searchParams.get('providerId');
  const categoryParam = searchParams.get('category');
  
  // --- LOGIKA PEMUATAN DATA PROFIL & ALAMAT ---
  useEffect(() => {
    const loadProfile = async () => {
        try {
            const res = await fetchProfile();
            const profile = res.data.profile;
            setUserProfile(profile);

            // [BARU] Atur alamat default saat profil dimuat
            if (profile.address && profile.location) {
                setSelectedAddress(profile.address);
                setSelectedLocation(profile.location);
            }
        } catch (error) {
            console.error("Gagal memuat profil:", error);
            alert("Sesi berakhir atau gagal memuat profil. Mohon login ulang.");
            router.push('/login');
        } finally {
            setIsProfileLoading(false);
        }
    };
    loadProfile();
  }, [router]);
  // ---------------------------------------------

  const activeCartItems = useMemo(() => {
    return cart.filter((item) => {
      if (item.quantity <= 0) return false;
      
      if (orderTypeParam) {
        if (item.orderType !== orderTypeParam) return false;
        
        if (orderTypeParam === 'direct' && providerIdParam) {
            if (item.providerId !== providerIdParam) return false;
        }
        
        if (orderTypeParam === 'basic' && categoryParam) {
            if ((item.category ?? null) !== categoryParam) return false;
        }
      }
      return true;
    });
  }, [cart, orderTypeParam, providerIdParam, categoryParam]);

  const currentTotalAmount = activeCartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const currentTotalItems = activeCartItems.reduce((sum, item) => sum + item.quantity, 0);

  const estimatedDiscount = 0;
  const payableAmount = Math.max(currentTotalAmount - estimatedDiscount, 0);

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      setPromoMessage('Masukkan kode promo terlebih dahulu.');
      return;
    }
    setPromoMessage('Kode promo diterapkan secara otomatis jika valid.');
  };

  const handlePlaceOrderAndPay = async () => {
    if (activeCartItems.length === 0) return;
    
    if (!scheduledAt) {
        alert("Mohon pilih tanggal dan jam kunjungan terlebih dahulu.");
        return;
    }
    
    // [BARU] Validasi Alamat
    if (!selectedAddress || !selectedLocation || selectedLocation.coordinates[0] === 0) {
        alert("Mohon lengkapi alamat dan titik lokasi Anda.");
        return;
    }

    if (!isSnapLoaded) {
      alert('Sistem pembayaran sedang dimuat, mohon tunggu sebentar...');
      return;
    }
    
    setIsProcessing(true);

    try {
      const mainItem = activeCartItems[0];
      
      // [UPDATE] Sertakan Alamat dan Lokasi ke Payload
      const orderPayload: CreateOrderPayload = {
        orderType: mainItem.orderType,
        providerId: mainItem.orderType === 'direct' ? mainItem.providerId : null,
        totalAmount: currentTotalAmount,
        scheduledAt: new Date(scheduledAt).toISOString(),
        shippingAddress: selectedAddress, // Kirim objek Address lengkap
        location: selectedLocation,       // Kirim objek Location lengkap
        items: activeCartItems.map(item => ({
            serviceId: item.serviceId,
            name: item.serviceName,
            quantity: item.quantity,
            price: item.pricePerUnit,
            note: '' 
        }))
      };

      console.log("1. Membuat Order...", orderPayload);
      const orderRes = await createOrder(orderPayload);
      const orderId = orderRes.data._id;
      console.log("   ✅ Order Terbentuk ID:", orderId);

      console.log("2. Meminta Token Pembayaran...");
      const paymentRes = await createPayment(orderId);
      const { snapToken } = paymentRes.data;
      console.log("   ✅ Token Didapat:", snapToken);

      if (window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: function(result: any) {
            console.log('Payment Success:', result);
            clearCart(); 
            alert('Pembayaran Berhasil! Terima kasih.');
            router.push('/orders'); 
          },
          onPending: function(result: any) {
            console.log('Payment Pending:', result);
            clearCart(); 
            alert('Pesanan dibuat. Silakan selesaikan pembayaran Anda.');
            router.push('/orders'); 
          },
          onError: function(result: any) {
            console.error('Payment Error:', result);
            alert('Pembayaran Gagal. Silakan coba lagi.');
          },
          onClose: function() {
            console.log('Customer closed the popup');
            alert('Anda menutup halaman pembayaran. Pesanan tersimpan di menu "Pesanan".');
            clearCart(); 
            router.push('/orders'); 
          }
        });
      } else {
        alert("Terjadi kesalahan memuat modul pembayaran. Silakan refresh halaman.");
      }

    } catch (error: any) {
      console.error("Proses Gagal:", error);
      const errMsg = error.response?.data?.message || "Terjadi kesalahan sistem.";
      alert(`Gagal: ${errMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isHydrated || isProfileLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
            Memuat data keranjang & profil...
        </div>
    );
  }

  if (activeCartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-md text-center space-y-3 max-w-md w-full border border-gray-100">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2 text-red-600">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Keranjang Kosong</h1>
          <p className="text-sm text-gray-600">Tambahkan layanan di halaman checkout sebelum memproses pesanan.</p>
          <Link
            href="/"
            className="inline-flex justify-center px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors mt-2"
          >
            Cari Layanan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans">
      
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-red-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Pembayaran</span>
            <h1 className="text-xl font-bold text-gray-900">Ringkasan & Bayar</h1>
            <p className="text-xs text-gray-500">Selesaikan pesanan Anda dengan aman.</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 lg:px-8 py-8 space-y-6">
        
        {/* Detail Item Pesanan */}
        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Item Pesanan</p>
              <h2 className="text-lg font-bold text-gray-900">Layanan yang dipesan</h2>
            </div>
            <button onClick={() => router.back()} className="text-sm font-bold text-red-600 hover:text-red-700 hover:underline">
              Ubah
            </button>
          </div>

          <div className="space-y-4">
            {activeCartItems.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 border border-gray-100 rounded-2xl p-4 hover:border-red-100 transition-colors">
                <div className="space-y-1">
                  <p className="text-base font-bold text-gray-900 leading-tight">{item.serviceName}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.orderType === 'direct' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                        {item.orderType}
                    </span>
                    {item.providerName && <span>• {item.providerName}</span>}
                  </div>
                  <p className="text-xs text-gray-600 font-medium mt-1">{item.quantity} x {formatCurrency(item.pricePerUnit)}</p>
                </div>
                <p className="text-sm font-bold text-gray-900 whitespace-nowrap">{formatCurrency(item.totalPrice)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Informasi & Pembayaran */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Kiri: Alamat, Tanggal & Promo */}
          <div className="md:col-span-2 space-y-6">
            
            {/* INPUT JADWAL KUNJUNGAN */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <div>
                  <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Jadwal</p>
                  <h2 className="text-lg font-bold text-gray-900">Kapan kami harus datang?</h2>
                </div>
                <div className="relative">
                    <input 
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)} // Tidak boleh masa lalu
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    />
                    <p className="text-xs text-gray-400 mt-2">* Pilih tanggal dan jam kunjungan yang Anda inginkan.</p>
                </div>
            </div>

            {/* Alamat */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Lokasi</p>
                  <h2 className="text-lg font-bold text-gray-900">Alamat Pelayanan</h2>
                </div>
                <button 
                   onClick={() => router.push('/profile')} // Arahkan ke halaman profile untuk ubah alamat
                   className="text-sm font-bold text-red-600 hover:text-red-700 hover:underline"
                >
                    Ubah
                </button>
              </div>
              
              {/* [UPDATE] Tampilkan Alamat Default User */}
              {selectedAddress && selectedLocation ? (
                 <div className="text-sm text-gray-700 space-y-1 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <p className="font-bold text-gray-900 leading-snug">
                        {userProfile?.fullName} ({selectedAddress.city})
                    </p>
                    <p className="text-gray-700 leading-snug">
                        {selectedAddress.detail}, Kel. {selectedAddress.village}, Kec. {selectedAddress.district}
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                        Koordinat: {selectedLocation.coordinates[1].toFixed(5)}, {selectedLocation.coordinates[0].toFixed(5)}
                    </p>
                </div>
              ) : (
                <div className="text-sm text-gray-700 space-y-1 bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                    <p className="font-bold text-gray-900">Alamat Belum Lengkap</p>
                    <p className="text-yellow-800 text-xs">Silakan lengkapi alamat dan titik lokasi Anda di menu Akun.</p>
                </div>
              )}
            </div>

            {/* Promo */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Voucher</p>
              <h2 className="text-lg font-bold text-gray-900">Kode Promo</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Masukkan kode promo"
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-bold"
                />
                <button
                  onClick={handleApplyPromo}
                  className="px-6 py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors text-sm"
                >
                  Terapkan
                </button>
              </div>
              {promoMessage && <p className="text-xs text-gray-500 animate-fadeIn">{promoMessage}</p>}
            </div>
          </div>

          {/* Kanan: Total & Tombol Bayar (Sticky) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5 h-fit sticky top-24">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Tagihan</p>
                <h2 className="text-lg font-bold text-gray-900">Rincian Biaya</h2>
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{currentTotalItems} item</span>
            </div>

            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Subtotal Layanan</span>
                <span className="font-bold text-gray-900">{formatCurrency(currentTotalAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-green-600">
                <span>Diskon</span>
                <span className="font-bold">-{formatCurrency(estimatedDiscount)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-500">
                <span>Biaya Aplikasi</span>
                <span className="font-medium">Gratis</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 pt-4 flex items-center justify-between">
              <span className="text-base font-bold text-gray-900">Total Bayar</span>
              <span className="text-2xl font-black text-red-600">{formatCurrency(payableAmount)}</span>
            </div>

            {/* TOMBOL BAYAR UTAMA */}
            <button 
              onClick={handlePlaceOrderAndPay}
              disabled={isProcessing || !selectedAddress || !scheduledAt} // Disable jika alamat/jadwal kosong
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2 ${
                isProcessing || !selectedAddress || !scheduledAt 
                  ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-red-600 hover:bg-red-700 shadow-red-200 hover:-translate-y-1'
              }`}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses Pembayaran...
                </>
              ) : (
                'Bayar Sekarang'
              )}
            </button>
            
            <p className="text-[10px] text-center text-gray-400">
                Pembayaran aman didukung oleh Midtrans.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

// [PERBAIKAN] Export Default dengan Suspense Boundary
export default function OrderSummaryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
         <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
            <span>Memuat halaman pembayaran...</span>
         </div>
      </div>
    }>
      <OrderSummaryContent />
    </Suspense>
  );
}