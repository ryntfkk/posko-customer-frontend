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
      
      const orderPayload: CreateOrderPayload = {
        orderType: mainItem.orderType,
        providerId: mainItem.orderType === 'direct' ? mainItem.providerId : null,
        totalAmount: currentTotalAmount,
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
          alternatePhone: customerContact.alternatePhone?.trim() || ''
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

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === 'POSKO10') {
      setPromoMessage('✅ Promo POSKO10 berhasil diterapkan!  (Mock)');
    } else if (promoCode) {
      setPromoMessage('❌ Kode promo tidak valid.');
    } else {
      setPromoMessage(null);
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
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
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
          {/* FIX: min-w-0 ditambahkan di sini untuk mencegah overflow di Safari */}
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Nama Penerima</label>
                  <input 
                    type="text"
                    value={customerContact.name}
                    onChange={(e) => setCustomerContact(prev => ({...prev, name: e.target.value}))}
                    placeholder="Nama penerima"
                    // FIX: min-w-0 dan appearance-none ditambahkan
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
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">No.HP Cadangan (opsional)</label>
                <input 
                  type="tel"
                  value={customerContact.alternatePhone}
                  onChange={(e) => setCustomerContact(prev => ({...prev, alternatePhone: e.target.value}))}
                  placeholder="Nomor alternatif"
                  className="w-full min-w-0 appearance-none px-4 py-2 md:py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                />
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
                    // FIX: min-w-0 dan appearance-none SANGAT PENTING untuk datetime-local di Safari
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

                    {/* Map langsung dirender */}
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

            {/* DETAIL PROPERTI */}
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div>
                <p className="text-[10px] md:text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Properti</p>
                <h2 className="text-base md:text-lg font-bold text-gray-900">Detail Lokasi</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
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
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Lantai</label>
                  <input 
                    type="number"
                    min="0"
                    value={propertyDetails.floor ??  ''}
                    onChange={(e) => setPropertyDetails(prev => ({...prev, floor: e.target.value ?  parseInt(e.target.value) : null}))}
                    placeholder="Contoh: 1"
                    className="w-full min-w-0 appearance-none px-4 py-2 md:py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={propertyDetails.hasParking}
                    onChange={(e) => setPropertyDetails(prev => ({...prev, hasParking: e.target.checked}))}
                    className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-xs md:text-sm text-gray-700">Ada parkir</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={propertyDetails.hasElevator}
                    onChange={(e) => setPropertyDetails(prev => ({...prev, hasElevator: e.target.checked}))}
                    className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-xs md:text-sm text-gray-700">Ada lift</span>
                </label>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Catatan Akses</label>
                <input 
                  type="text"
                  value={propertyDetails.accessNote}
                  onChange={(e) => setPropertyDetails(prev => ({...prev, accessNote: e.target.value}))}
                  placeholder="Pagar warna hitam, masuk dari samping..."
                  className="w-full min-w-0 appearance-none px-4 py-2 md:py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* CATATAN ORDER */}
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <div>
                <p className="text-[10px] md:text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Catatan</p>
                <h2 className="text-base md:text-lg font-bold text-gray-900">Instruksi Khusus</h2>
              </div>
              <textarea 
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value.slice(0, 500))}
                placeholder="Pesan tambahan untuk mitra..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none"
              />
            </div>

            {/* UPLOAD FOTO */}
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div>
                <p className="text-[10px] md:text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Dokumentasi</p>
                <h2 className="text-base md:text-lg font-bold text-gray-900">Lampiran Foto</h2>
                <p className="text-xs text-gray-500 mt-1">Tambahkan foto kondisi awal (maks. 5 foto)</p>
              </div>
              
              {/* Gunakan komponen Upload baru */}
              <AttachmentUploader 
                attachments={attachments}
                onAdd={handleAddAttachment}
                onRemove={handleRemoveAttachment}
              />
            </div>

            {/* Promo */}
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <p className="text-[10px] md:text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Voucher</p>
              <h2 className="text-base md:text-lg font-bold text-gray-900">Kode Promo</h2>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Masukkan kode promo..."
                  className="flex-1 min-w-0 appearance-none px-4 py-2 md:py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                />
                <button 
                  onClick={handleApplyPromo}
                  className="px-6 py-2 md:py-3 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Terapkan
                </button>
              </div>
              {promoMessage && (
                <p className={`text-xs md:text-sm font-medium ${promoMessage.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                  {promoMessage}
                </p>
              )}
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
                {promoMessage?.startsWith('✅') && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon Promo</span>
                    <span className="font-semibold">-Rp 10.000</span>
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-bold text-sm md:text-base">Total Pembayaran</span>
                  <span className="text-xl md:text-2xl font-black text-red-600">{formatCurrency(currentTotalAmount)}</span>
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