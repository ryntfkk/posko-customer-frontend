// src/app/(customer)/order/summary/page.tsx
'use client';

import { useMemo, useState, Suspense, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic'; 

import { useCart } from '@/features/cart/useCart';
import { createOrder } from '@/features/orders/api';
import { createPayment } from '@/features/payments/api'; 
import { CreateOrderPayload, CustomerContact, PropertyDetails, ScheduledTimeSlot, Attachment } from '@/features/orders/types';
import useMidtrans from '@/hooks/useMidtrans'; 
import { fetchProfile } from '@/features/auth/api';
import { User, Address, GeoLocation } from '@/features/auth/types';

// Import komponen lokal
import { AttachmentUploader } from '@/components/OrderComponents'; 

// Import Dynamic untuk Map
const LocationPicker = dynamic(
  () => import('@/components/OrderComponents').then((mod) => mod.LocationPicker),
  { 
    ssr: false, 
    loading: () => <div className="w-full h-[300px] bg-gray-200 animate-pulse rounded-xl flex items-center justify-center text-gray-500 text-sm">Memuat Peta...</div>
  }
);

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

// --- DATA MOCKUP VOUCHER ---
const AVAILABLE_VOUCHERS = [
  { code: 'POSKO10', discount: 10000, description: 'Diskon Rp 10.000 untuk pengguna baru' },
  { code: 'HEMAT50', discount: 50000, description: 'Potongan spesial akhir bulan' },
  { code: 'ONGKIR0', discount: 5000, description: 'Potongan biaya platform' },
];

function OrderSummaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); 
  
  const { cart, clearCart, isHydrated } = useCart(); 
  
  const isSnapLoaded = useMidtrans();

  // State Data
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // State Form/Input
  const [isProcessing, setIsProcessing] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  
  // State Promo (Modal & Code)
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{code: string, discount: number} | null>(null);
  
  // Alamat & Lokasi
  const [selectedAddress, setSelectedAddress] = useState<Address | undefined>(undefined);
  // Lokasi yang akan dikirim ke API
  const [orderLocation, setOrderLocation] = useState<GeoLocation | undefined>(undefined);
  
  // Customer Contact
  const [customerContact, setCustomerContact] = useState<CustomerContact>({
    name: '',
    phone: '',
    alternatePhone: ''
  });
  const [showAlternatePhone, setShowAlternatePhone] = useState(false); // Toggle no hp cadangan
  
  // Order Note
  const [orderNote, setOrderNote] = useState('');
  
  // Property Details
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails>({
    type: '',
    floor: null,
    hasParking: true,
    hasElevator: false,
    accessNote: ''
  });
  
  // Time Slot
  const [timeSlot, setTimeSlot] = useState<ScheduledTimeSlot>({
    preferredStart: '',
    preferredEnd: '',
    isFlexible: true
  });
  
  // Attachments 
  interface UIAttachment extends Attachment {
    file?: File;
  }
  const [attachments, setAttachments] = useState<UIAttachment[]>([]);

  // Load User Profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetchProfile();
        const profile = res.data.profile;
        setUserProfile(profile);

        if (profile.address) {
          setSelectedAddress(profile.address);
        }
        if (profile.location && profile.location.coordinates && profile.location.coordinates[0] !== 0) {
          setOrderLocation(profile.location);
        }
        
        // Pre-fill customer contact dari profile
        setCustomerContact({
          name: profile.fullName || '',
          phone: profile.phoneNumber || '',
          alternatePhone: ''
        });
      } catch (error) {
        console.error("Gagal memuat profil:", error);
      } finally {
        setIsProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  // Parse Query Params
  const checkoutType = searchParams?.get('type') as 'direct' | 'basic' || 'basic';
  const selectedProviderId = searchParams?.get('providerId') || null;
  const categoryParam = searchParams?.get('category') || null;

  // Filter Keranjang
  const activeCartItems = useMemo(() => {
    return cart.filter((item) => {
      if (item.quantity <= 0) return false;

      if (checkoutType === 'basic') {
        if (item.orderType !== 'basic') return false;
        if (categoryParam) {
          const itemCategory = (item.category ??  '').toLowerCase();
          const filterCategory = categoryParam.toLowerCase();
          return itemCategory === filterCategory;
        }
        return true;
      } else {
        return item.orderType === 'direct' && item.providerId === selectedProviderId;
      }
    });
  }, [cart, checkoutType, selectedProviderId, categoryParam]);

  const currentTotalAmount = activeCartItems.reduce((sum, item) => sum + item.totalPrice, 0);

  // Handler add attachment pakai File
  const handleAddAttachment = useCallback((file: File, desc: string) => {
    const previewUrl = URL.createObjectURL(file);
    
    setAttachments(prev => [...prev, {
      url: previewUrl, 
      type: 'photo',
      description: desc.trim(),
      file: file 
    }]);
  }, []);

  // Handler remove attachment
  const handleRemoveAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Handler update lokasi dari Map
  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setOrderLocation({
        type: 'Point',
        coordinates: [lng, lat] // GeoJSON format: [lng, lat]
    });
  }, []);

  // Handler Promo
  const handleApplyPromo = (code: string) => {
    const voucher = AVAILABLE_VOUCHERS.find(v => v.code === code.toUpperCase());
    if (voucher) {
        setAppliedPromo({ code: voucher.code, discount: voucher.discount });
        setIsPromoModalOpen(false);
        setPromoCodeInput('');
        alert(`Selamat! Promo ${voucher.code} berhasil digunakan.`);
    } else {
        alert('Kode promo tidak valid atau kadaluarsa.');
    }
  };

  const handleRemovePromo = () => {
      setAppliedPromo(null);
  };

  // Submit Order
  const handlePlaceOrderAndPay = async () => {
    if (!scheduledAt) {
      alert("Mohon pilih tanggal dan jam kunjungan terlebih dahulu.");
      return;
    }
    
    if (!selectedAddress || !orderLocation || orderLocation.coordinates[0] === 0) {
      alert("Mohon lengkapi alamat dan titik lokasi Anda.");
      return;
    }
    
    if (!customerContact.phone.trim()) {
      alert("Mohon isi nomor HP yang bisa dihubungi.");
      return;
    }

    if (! isSnapLoaded) {
      alert('Sistem pembayaran sedang dimuat, mohon tunggu sebentar...');
      return;
    }
    
    setIsProcessing(true);

    try {
      const mainItem = activeCartItems[0];
      
      // Hitung total setelah diskon (untuk dikirim ke backend, pastikan backend validasi ulang)
      const finalAmount = Math.max(0, currentTotalAmount - (appliedPromo?.discount || 0));

      const orderPayload: CreateOrderPayload = {
        orderType: mainItem.orderType,
        providerId: mainItem.orderType === 'direct' ? mainItem.providerId : null,
        totalAmount: finalAmount, 
        scheduledAt: new Date(scheduledAt).toISOString(),
        shippingAddress: selectedAddress,
        location: orderLocation, 
        items: activeCartItems.map(item => ({
          serviceId: item.serviceId,
          name: item.serviceName,
          quantity: item.quantity,
          price: item.pricePerUnit,
          note: '' 
        })),
        customerContact: {
          name: customerContact.name.trim() || userProfile?.fullName || '',
          phone: customerContact.phone.trim(),
          alternatePhone: showAlternatePhone ? (customerContact.alternatePhone?.trim() || '') : ''
        },
        orderNote: orderNote.trim(),
        propertyDetails: propertyDetails,
        scheduledTimeSlot: timeSlot,
        attachments: attachments.map(att => ({
            url: att.url,
            type: att.type,
            description: att.description
        }))
      };

      console.log("1.Membuat Order...", orderPayload);
      const orderRes = await createOrder(orderPayload);
      const orderId = orderRes.data._id;
      const orderNumber = orderRes.data.orderNumber;
      
      console.log("2. Meminta Token Pembayaran...");
      const paymentRes = await createPayment(orderId);
      const snapToken = paymentRes.data.snapToken;

      console.log("3.Membuka Snap Midtrans...");
      if (window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: (result) => {
            console.log('✅ Pembayaran Berhasil:', result);
            alert(`Pembayaran Berhasil! Order: ${orderNumber}`);
            clearCart();
            router.push('/orders');
          },
          onPending: (result) => {
            console.log('⏳ Menunggu Pembayaran:', result);
            alert(`Menunggu pembayaran untuk order ${orderNumber}...`);
            router.push(`/orders/${orderId}`);
          },
          onError: (result) => {
            console.error('❌ Gagal Bayar:', result);
            alert('Pembayaran gagal. Silakan coba lagi dari halaman detail order.');
            router.push(`/orders/${orderId}`);
          },
          onClose: () => {
            console.log('📦 Popup Ditutup. Order tersimpan.');
            router.push(`/orders/${orderId}`);
          }
        });
      }

    } catch (error) {
      console.error("❌ Error:", error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProfileLoading || !isHydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500">Memuat data...</p>
      </div>
    );
  }
  
  if (activeCartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8 text-center">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Keranjang Kosong</h2>
        <Link href="/checkout" className="inline-block mt-4 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors">
          Kembali ke Layanan
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans relative">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center gap-3 md:gap-4">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-red-600 p-1">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wide text-gray-400 block">Langkah Terakhir</span>
            <h1 className="text-lg md:text-xl font-bold text-gray-900">Ringkasan Pesanan</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-6 space-y-4 md:space-y-6">
        
        {/* Detail Item Pesanan */}
        <section className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Item Pesanan</p>
              <h2 className="text-base md:text-lg font-bold text-gray-900">Layanan yang dipesan</h2>
            </div>
            <button onClick={() => router.back()} className="text-xs md:text-sm font-bold text-red-600 hover:text-red-700 hover:underline">
              Ubah
            </button>
          </div>

          <div className="space-y-3 md:space-y-4">
            {activeCartItems.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 py-3 border-b border-gray-50 last:border-b-0">
                <div className="flex-1">
                  <h3 className="text-sm md:text-base font-bold text-gray-900 line-clamp-2">{item.serviceName}</h3>
                  <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">
                    {item.orderType === 'direct' ? `Mitra: ${item.providerName}` : 'Cari Otomatis'}
                  </p>
                  <p className="text-xs text-gray-600 font-medium mt-1">{item.quantity} x {formatCurrency(item.pricePerUnit)}</p>
                </div>
                <p className="text-sm md:text-base font-bold text-gray-900 whitespace-nowrap">{formatCurrency(item.totalPrice)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Informasi & Pembayaran */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          
          {/* Kiri: Form Input */}
          <div className="md:col-span-2 space-y-4 md:space-y-6 min-w-0">
            
            {/* KONTAK CUSTOMER */}
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] md:text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Kontak</p>
                  <h2 className="text-base md:text-lg font-bold text-gray-900">Info Kontak <span className="text-red-500">*</span></h2>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Nama Penerima</label>
                    <input 
                      type="text"
                      value={customerContact.name}
                      onChange={(e) => setCustomerContact(prev => ({...prev, name: e.target.value}))}
                      placeholder="Nama penerima"
                      className="w-full min-w-0 appearance-none px-4 py-2 md:py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">No.HP Utama <span className="text-red-500">*</span></label>
                    <input 
                      type="tel"
                      value={customerContact.phone}
                      onChange={(e) => setCustomerContact(prev => ({...prev, phone: e.target.value}))}
                      placeholder="08xx-xxxx-xxxx"
                      className="w-full min-w-0 appearance-none px-4 py-2 md:py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Toggle Nomor Cadangan */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                        <input 
                            type="checkbox"
                            checked={showAlternatePhone}
                            onChange={(e) => setShowAlternatePhone(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-xs font-medium text-gray-700">Tambah nomor darurat / cadangan</span>
                    </label>

                    {showAlternatePhone && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                             <input 
                                type="tel"
                                value={customerContact.alternatePhone}
                                onChange={(e) => setCustomerContact(prev => ({...prev, alternatePhone: e.target.value}))}
                                placeholder="Nomor HP Alternatif"
                                className="w-full md:w-1/2 min-w-0 appearance-none px-4 py-2 md:py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                            />
                        </div>
                    )}
                </div>
              </div>
            </div>

            {/* JADWAL KUNJUNGAN */}
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div>
                <p className="text-[10px] md:text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Jadwal</p>
                <h2 className="text-base md:text-lg font-bold text-gray-900">Waktu Kedatangan</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Tanggal & Waktu <span className="text-red-500">*</span></label>
                  <input 
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full min-w-0 appearance-none px-4 py-2 md:py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Jam Mulai (Pref)</label>
                    <input 
                      type="time"
                      value={timeSlot.preferredStart}
                      onChange={(e) => setTimeSlot(prev => ({...prev, preferredStart: e.target.value}))}
                      className="w-full min-w-0 appearance-none px-4 py-2 md:py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Jam Selesai (Pref)</label>
                    <input 
                      type="time"
                      value={timeSlot.preferredEnd}
                      onChange={(e) => setTimeSlot(prev => ({...prev, preferredEnd: e.target.value}))}
                      className="w-full min-w-0 appearance-none px-4 py-2 md:py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    />
                  </div>
                </div>
                
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <input 
                    type="checkbox"
                    checked={timeSlot.isFlexible}
                    onChange={(e) => setTimeSlot(prev => ({...prev, isFlexible: e.target.checked}))}
                    className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-xs md:text-sm text-gray-700">Waktu fleksibel</span>
                </label>
              </div>
            </div>

            {/* ALAMAT & MAPS INTEGRATION */}
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] md:text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Lokasi</p>
                  <h2 className="text-base md:text-lg font-bold text-gray-900">Alamat Pelayanan</h2>
                </div>
                <button 
                   onClick={() => router.push('/profile')}
                   className="text-xs md:text-sm font-bold text-red-600 hover:text-red-700 hover:underline"
                >
                    Ganti Alamat
                </button>
              </div>
              
              {selectedAddress && orderLocation ?  (
                 <div className="space-y-4">
                    <div className="text-sm text-gray-700 space-y-1 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <p className="font-bold text-gray-900 leading-snug text-sm md:text-base">
                            {userProfile?.fullName} ({selectedAddress.city})
                        </p>
                        <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                            {selectedAddress.detail}, Kel. {selectedAddress.village}, Kec.{selectedAddress.district}
                        </p>
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                             <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">Titik Peta</span>
                             <p className="text-gray-500 text-[10px]">
                                {orderLocation.coordinates[1].toFixed(5)}, {orderLocation.coordinates[0].toFixed(5)}
                            </p>
                        </div>
                    </div>

                    <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-2">Geser pin merah untuk memastikan titik lokasi akurat.</p>
                        <LocationPicker 
                            initialLat={orderLocation.coordinates[1]} 
                            initialLng={orderLocation.coordinates[0]}
                            onLocationChange={handleLocationChange}
                        />
                    </div>
                </div>
              ) : (
                <div className="text-sm text-gray-700 space-y-1 bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                    <p className="font-bold text-gray-900">Alamat Belum Lengkap</p>
                    <p className="text-yellow-800 text-xs">Silakan lengkapi alamat dan titik lokasi Anda di menu Akun.</p>
                </div>
              )}
            </div>

            {/* DETAIL PROPERTI (Layout Baru) */}
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div>
                <p className="text-[10px] md:text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Properti</p>
                <h2 className="text-base md:text-lg font-bold text-gray-900">Detail Lokasi</h2>
              </div>
              
              <div className="space-y-4">
                {/* Baris 1: Tipe Properti */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Tipe Properti</label>
                  <select 
                    value={propertyDetails.type}
                    onChange={(e) => setPropertyDetails(prev => ({...prev, type: e.target.value as PropertyDetails['type']}))}
                    className="w-full px-4 py-2 md:py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  >
                    <option value="">Pilih tipe...</option>
                    <option value="rumah">Rumah</option>
                    <option value="apartemen">Apartemen</option>
                    <option value="kantor">Kantor</option>
                    <option value="ruko">Ruko</option>
                    <option value="kendaraan">Kendaraan</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>

                {/* Baris 2: Lantai - Parkir - Lift */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                    <div className="w-full md:w-32">
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Lantai</label>
                        <input 
                            type="number"
                            min="0"
                            value={propertyDetails.floor ??  ''}
                            onChange={(e) => setPropertyDetails(prev => ({...prev, floor: e.target.value ?  parseInt(e.target.value) : null}))}
                            placeholder="Lt. ke"
                            className="w-full min-w-0 appearance-none px-4 py-2 md:py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                        />
                    </div>
                    
                    <div className="flex gap-4 md:pb-3">
                        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border border-transparent hover:border-gray-200 transition-all">
                            <input 
                                type="checkbox"
                                checked={propertyDetails.hasParking}
                                onChange={(e) => setPropertyDetails(prev => ({...prev, hasParking: e.target.checked}))}
                                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-xs font-medium text-gray-700">Ada parkir</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border border-transparent hover:border-gray-200 transition-all">
                            <input 
                                type="checkbox"
                                checked={propertyDetails.hasElevator}
                                onChange={(e) => setPropertyDetails(prev => ({...prev, hasElevator: e.target.checked}))}
                                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-xs font-medium text-gray-700">Ada lift</span>
                        </label>
                    </div>
                </div>
                
                {/* Baris 3: Catatan Akses */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Catatan Akses</label>
                  <input 
                    type="text"
                    value={propertyDetails.accessNote}
                    onChange={(e) => setPropertyDetails(prev => ({...prev, accessNote: e.target.value}))}
                    placeholder="Contoh: Pagar hitam, masuk lewat samping..."
                    className="w-full min-w-0 appearance-none px-4 py-2 md:py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* DOKUMENTASI & CATATAN (DIGABUNG) */}
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
               {/* Bagian Catatan */}
               <div className="space-y-3">
                    <div>
                        <p className="text-[10px] md:text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Tambahan</p>
                        <h2 className="text-base md:text-lg font-bold text-gray-900">Catatan Order</h2>
                    </div>
                    <textarea 
                        value={orderNote}
                        onChange={(e) => setOrderNote(e.target.value.slice(0, 500))}
                        placeholder="Tulis pesan tambahan atau instruksi khusus untuk mitra..."
                        rows={2}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none"
                    />
               </div>

               <div className="border-t border-gray-100"></div>

               {/* Bagian Foto */}
               <div className="space-y-3">
                   <div>
                        <h3 className="text-sm md:text-base font-bold text-gray-900">Lampiran Foto</h3>
                        <p className="text-xs text-gray-500 mt-1">Tambahkan foto kondisi awal (maks. 5 foto)</p>
                   </div>
                   <AttachmentUploader 
                        attachments={attachments}
                        onAdd={handleAddAttachment}
                        onRemove={handleRemoveAttachment}
                    />
               </div>
            </div>

          </div>

          {/* Kanan: Ringkasan Pembayaran */}
          <div className="space-y-6">
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 sticky top-24">
              <h2 className="text-base md:text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Ringkasan Pembayaran</h2>
              
              <div className="space-y-3 text-xs md:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal Layanan</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(currentTotalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Biaya Platform</span>
                  <span className="font-semibold text-green-600">Gratis</span>
                </div>
                
                {/* PROMO CODE DISPLAY */}
                {appliedPromo ? (
                   <div className="flex justify-between items-center text-green-600 bg-green-50 p-2 rounded-lg border border-green-100">
                     <div className="flex flex-col">
                        <span className="font-bold text-xs">Voucher: {appliedPromo.code}</span>
                        <span className="text-[10px] text-green-700">Berhasil diterapkan</span>
                     </div>
                     <div className="flex items-center gap-2">
                         <span className="font-semibold text-sm">-{formatCurrency(appliedPromo.discount)}</span>
                         <button onClick={handleRemovePromo} className="text-red-500 hover:text-red-700">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                         </button>
                     </div>
                   </div>
                ) : (
                    <div className="pt-2">
                        <button 
                            onClick={() => setIsPromoModalOpen(true)}
                            className="text-red-600 text-xs md:text-sm font-semibold hover:underline flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                            Makin hemat dengan promo?
                        </button>
                    </div>
                )}

              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-bold text-sm md:text-base">Total Pembayaran</span>
                  <span className="text-xl md:text-2xl font-black text-red-600">
                      {formatCurrency(Math.max(0, currentTotalAmount - (appliedPromo?.discount || 0)))}
                  </span>
                </div>
              </div>

              {/* TOMBOL BAYAR UTAMA */}
              <button 
                onClick={handlePlaceOrderAndPay}
                disabled={isProcessing || !selectedAddress || ! scheduledAt || !customerContact.phone.trim()}
                className={`w-full py-3 md:py-4 rounded-xl font-bold text-white text-sm md:text-base shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2 ${
                  isProcessing || ! selectedAddress || !scheduledAt || !customerContact.phone.trim()
                    ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                    : 'bg-red-600 hover:bg-red-700 shadow-red-200 hover:-translate-y-1'
                }`}
              >
                {isProcessing ?  (
                  <>
                    <svg className="animate-spin h-4 w-4 md:h-5 md:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memproses...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 md:w-5 md:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Bayar Sekarang
                  </>
                )}
              </button>

              <p className="text-[10px] md:text-xs text-gray-500 text-center">
                Dengan melanjutkan, Anda menyetujui Syarat & Ketentuan Posko.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL PROMO */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-gray-900">Pakai Promo</h3>
                    <button onClick={() => setIsPromoModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="p-4 space-y-4">
                    {/* Input Code */}
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={promoCodeInput}
                            onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                            placeholder="Masukkan kode voucher"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none uppercase"
                        />
                        <button 
                            onClick={() => handleApplyPromo(promoCodeInput)}
                            disabled={!promoCodeInput}
                            className="px-4 py-2 bg-gray-900 text-white font-bold rounded-xl disabled:bg-gray-300 hover:bg-gray-800 transition-colors"
                        >
                            Pakai
                        </button>
                    </div>
                    
                    {/* List Voucher */}
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Voucher Tersedia</p>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {AVAILABLE_VOUCHERS.map((voucher) => (
                                <div key={voucher.code} className="border border-gray-200 rounded-xl p-3 flex justify-between items-center hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer" onClick={() => handleApplyPromo(voucher.code)}>
                                    <div>
                                        <p className="font-bold text-gray-900">{voucher.code}</p>
                                        <p className="text-xs text-gray-500">{voucher.description}</p>
                                    </div>
                                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                                        Hemat {formatCurrency(voucher.discount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

export default function OrderSummaryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="text-sm text-gray-500">Memuat halaman...</p>
        </div>
      </div>
    }>
      <OrderSummaryContent />
    </Suspense>
  );
}

