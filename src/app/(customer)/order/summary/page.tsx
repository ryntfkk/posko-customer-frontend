// src/app/(customer)/order/summary/page.tsx
'use client';

import { useMemo, useState, Suspense, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import { useCart } from '@/features/cart/useCart';
import { createOrder } from '@/features/orders/api';
import { createPayment } from '@/features/payments/api'; 
import { CreateOrderPayload, CustomerContact, PropertyDetails, ScheduledTimeSlot, Attachment } from '@/features/orders/types';
import useMidtrans from '@/hooks/useMidtrans'; 
import { fetchProfile } from '@/features/auth/api';
import { User, Address, GeoLocation } from '@/features/auth/types';

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
  const [selectedLocation, setSelectedLocation] = useState<GeoLocation | undefined>(undefined);
  
  // [BARU] Customer Contact (CRITICAL)
  const [customerContact, setCustomerContact] = useState<CustomerContact>({
    name: '',
    phone: '',
    alternatePhone: ''
  });
  
  // [BARU] Order Note (HIGH)
  const [orderNote, setOrderNote] = useState('');
  
  // [BARU] Property Details (MEDIUM)
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails>({
    type: '',
    floor: null,
    hasParking: true,
    hasElevator: false,
    accessNote: ''
  });
  
  // [BARU] Time Slot (MEDIUM)
  const [timeSlot, setTimeSlot] = useState<ScheduledTimeSlot>({
    preferredStart: '',
    preferredEnd: '',
    isFlexible: true
  });
  
  // [BARU] Attachments (HIGH)
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentDesc, setAttachmentDesc] = useState('');

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
          setSelectedLocation(profile.location);
        }
        
        // [BARU] Pre-fill customer contact dari profile
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

  // [BARU] Handler untuk add attachment
  const handleAddAttachment = useCallback(() => {
    if (! attachmentUrl.trim()) {
      alert('Masukkan URL gambar terlebih dahulu');
      return;
    }
    
    if (attachments.length >= 5) {
      alert('Maksimal 5 lampiran');
      return;
    }
    
    setAttachments(prev => [...prev, {
      url: attachmentUrl.trim(),
      type: 'photo',
      description: attachmentDesc.trim()
    }]);
    
    setAttachmentUrl('');
    setAttachmentDesc('');
  }, [attachmentUrl, attachmentDesc, attachments.length]);

  // [BARU] Handler untuk remove attachment
  const handleRemoveAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Submit Order
  const handlePlaceOrderAndPay = async () => {
    if (!scheduledAt) {
      alert("Mohon pilih tanggal dan jam kunjungan terlebih dahulu.");
      return;
    }
    
    if (!selectedAddress || !selectedLocation || selectedLocation.coordinates[0] === 0) {
      alert("Mohon lengkapi alamat dan titik lokasi Anda.");
      return;
    }
    
    // [BARU] Validasi Customer Contact (CRITICAL)
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
      
      // [UPDATE] Payload dengan field baru
      const orderPayload: CreateOrderPayload = {
        orderType: mainItem.orderType,
        providerId: mainItem.orderType === 'direct' ? mainItem.providerId : null,
        totalAmount: currentTotalAmount,
        scheduledAt: new Date(scheduledAt).toISOString(),
        shippingAddress: selectedAddress,
        location: selectedLocation,
        items: activeCartItems.map(item => ({
          serviceId: item.serviceId,
          name: item.serviceName,
          quantity: item.quantity,
          price: item.pricePerUnit,
          note: '' 
        })),
        // [BARU] Field tambahan
        customerContact: {
          name: customerContact.name.trim() || userProfile?.fullName || '',
          phone: customerContact.phone.trim(),
          alternatePhone: customerContact.alternatePhone?.trim() || ''
        },
        orderNote: orderNote.trim(),
        propertyDetails: propertyDetails,
        scheduledTimeSlot: timeSlot,
        attachments: attachments
      };

      console.log("1.Membuat Order...", orderPayload);
      const orderRes = await createOrder(orderPayload);
      const orderId = orderRes.data._id;
      const orderNumber = orderRes.data.orderNumber;
      console.log(`   ✅ Order Terbentuk: ${orderNumber} (ID: ${orderId})`);

      console.log("2. Meminta Token Pembayaran...");
      const paymentRes = await createPayment(orderId);
      const snapToken = paymentRes.data.snapToken;
      console.log("   ✅ Token Diterima!");

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

  // Promo Code
  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === 'POSKO10') {
      setPromoMessage('✅ Promo POSKO10 berhasil diterapkan!  (Mock)');
    } else if (promoCode) {
      setPromoMessage('❌ Kode promo tidak valid.');
    } else {
      setPromoMessage(null);
    }
  };

  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500">Memuat data...</p>
      </div>
    );
  }

  if (! isHydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500">Memuat keranjang...</p>
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
        <p className="text-sm text-gray-500 mb-6">Anda belum memilih layanan apapun.</p>
        <Link href="/checkout" className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors">
          Kembali ke Daftar Layanan
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-red-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Langkah Terakhir</span>
            <h1 className="text-xl font-bold text-gray-900">Ringkasan Pesanan</h1>
          </div>
        </div>
      </header>

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
              <div key={item.id} className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-b-0">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{item.serviceName}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.orderType === 'direct' ? `Mitra: ${item.providerName}` : 'Cari Otomatis'}
                  </p>
                  <p className="text-xs text-gray-600 font-medium mt-1">{item.quantity} x {formatCurrency(item.pricePerUnit)}</p>
                </div>
                <p className="text-sm font-bold text-gray-900 whitespace-nowrap">{formatCurrency(item.totalPrice)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Informasi & Pembayaran */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Kiri: Form Input */}
          <div className="md:col-span-2 space-y-6">
            
            {/* [BARU] KONTAK CUSTOMER (CRITICAL) */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Kontak</p>
                  <h2 className="text-lg font-bold text-gray-900">Informasi Kontak <span className="text-red-500">*</span></h2>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Nama Penerima</label>
                  <input 
                    type="text"
                    value={customerContact.name}
                    onChange={(e) => setCustomerContact(prev => ({...prev, name: e.target.value}))}
                    placeholder="Nama yang menerima kunjungan"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">No.HP Utama <span className="text-red-500">*</span></label>
                  <input 
                    type="tel"
                    value={customerContact.phone}
                    onChange={(e) => setCustomerContact(prev => ({...prev, phone: e.target.value}))}
                    placeholder="08xx-xxxx-xxxx"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">No.HP Cadangan (opsional)</label>
                <input 
                  type="tel"
                  value={customerContact.alternatePhone}
                  onChange={(e) => setCustomerContact(prev => ({...prev, alternatePhone: e.target.value}))}
                  placeholder="Nomor alternatif jika tidak bisa dihubungi"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* INPUT JADWAL KUNJUNGAN */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div>
                <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Jadwal</p>
                <h2 className="text-lg font-bold text-gray-900">Kapan kami harus datang?</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Tanggal & Waktu Kedatangan <span className="text-red-500">*</span></label>
                  <input 
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  />
                </div>
                
                {/* [BARU] TIME SLOT PREFERENCE (MEDIUM) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Jam Mulai Preferensi</label>
                    <input 
                      type="time"
                      value={timeSlot.preferredStart}
                      onChange={(e) => setTimeSlot(prev => ({...prev, preferredStart: e.target.value}))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Jam Selesai Preferensi</label>
                    <input 
                      type="time"
                      value={timeSlot.preferredEnd}
                      onChange={(e) => setTimeSlot(prev => ({...prev, preferredEnd: e.target.value}))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    />
                  </div>
                </div>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={timeSlot.isFlexible}
                    onChange={(e) => setTimeSlot(prev => ({...prev, isFlexible: e.target.checked}))}
                    className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Waktu fleksibel (boleh datang di luar rentang jam di atas)</span>
                </label>
              </div>
              
              <p className="text-xs text-gray-400">* Pilih tanggal dan jam kunjungan yang Anda inginkan.</p>
            </div>

            {/* Alamat */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Lokasi</p>
                  <h2 className="text-lg font-bold text-gray-900">Alamat Pelayanan</h2>
                </div>
                <button 
                   onClick={() => router.push('/profile')}
                   className="text-sm font-bold text-red-600 hover:text-red-700 hover:underline"
                >
                    Ubah
                </button>
              </div>
              
              {selectedAddress && selectedLocation ?  (
                 <div className="text-sm text-gray-700 space-y-1 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <p className="font-bold text-gray-900 leading-snug">
                        {userProfile?.fullName} ({selectedAddress.city})
                    </p>
                    <p className="text-gray-700 leading-snug">
                        {selectedAddress.detail}, Kel. {selectedAddress.village}, Kec.{selectedAddress.district}
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

            {/* [BARU] DETAIL PROPERTI (MEDIUM) */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div>
                <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Detail Lokasi</p>
                <h2 className="text-lg font-bold text-gray-900">Informasi Properti</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Tipe Properti</label>
                  <select 
                    value={propertyDetails.type}
                    onChange={(e) => setPropertyDetails(prev => ({...prev, type: e.target.value as PropertyDetails['type']}))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
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
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Lantai (jika apartemen/gedung)</label>
                  <input 
                    type="number"
                    min="0"
                    value={propertyDetails.floor ??  ''}
                    onChange={(e) => setPropertyDetails(prev => ({...prev, floor: e.target.value ?  parseInt(e.target.value) : null}))}
                    placeholder="Contoh: 5"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={propertyDetails.hasParking}
                    onChange={(e) => setPropertyDetails(prev => ({...prev, hasParking: e.target.checked}))}
                    className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Ada tempat parkir</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={propertyDetails.hasElevator}
                    onChange={(e) => setPropertyDetails(prev => ({...prev, hasElevator: e.target.checked}))}
                    className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Ada lift/elevator</span>
                </label>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Catatan Akses Khusus</label>
                <input 
                  type="text"
                  value={propertyDetails.accessNote}
                  onChange={(e) => setPropertyDetails(prev => ({...prev, accessNote: e.target.value}))}
                  placeholder="Contoh: Masuk dari pintu samping, warna hijau"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* [BARU] CATATAN ORDER (HIGH) */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <div>
                <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Catatan</p>
                <h2 className="text-lg font-bold text-gray-900">Instruksi Khusus untuk Mitra</h2>
              </div>
              <textarea 
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value.slice(0, 500))}
                placeholder="Contoh: Hubungi via WhatsApp sebelum datang, parkir di basement lantai 2, dll."
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none"
              />
              <p className="text-xs text-gray-400 text-right">{orderNote.length}/500 karakter</p>
            </div>

            {/* [BARU] LAMPIRAN/FOTO (HIGH) */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div>
                <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Dokumentasi</p>
                <h2 className="text-lg font-bold text-gray-900">Lampiran Foto/Gambar</h2>
                <p className="text-xs text-gray-500 mt-1">Tambahkan foto kondisi awal untuk referensi mitra (maks. 5 foto)</p>
              </div>
              
              {/* Input URL gambar */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input 
                    type="url"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="Masukkan URL gambar..."
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  />
                  <button 
                    type="button"
                    onClick={handleAddAttachment}
                    disabled={attachments.length >= 5}
                    className="px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Tambah
                  </button>
                </div>
                <input 
                  type="text"
                  value={attachmentDesc}
                  onChange={(e) => setAttachmentDesc(e.target.value)}
                  placeholder="Deskripsi gambar (opsional)..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                />
              </div>
              
              {/* Daftar lampiran */}
              {attachments.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {attachments.map((att, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                        <Image 
                          src={att.url} 
                          alt={att.description || `Lampiran ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-image.png';
                          }}
                        />
                      </div>
                      {att.description && (
                        <p className="text-xs text-gray-500 mt-1 truncate">{att.description}</p>
                      )}
                      <button 
                        type="button"
                        onClick={() => handleRemoveAttachment(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
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
                  placeholder="Masukkan kode promo..."
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                />
                <button 
                  onClick={handleApplyPromo}
                  className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Terapkan
                </button>
              </div>
              {promoMessage && (
                <p className={`text-sm font-medium ${promoMessage.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                  {promoMessage}
                </p>
              )}
            </div>
          </div>

          {/* Kanan: Ringkasan Pembayaran */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Ringkasan Pembayaran</h2>
              
              <div className="space-y-3 text-sm">
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
                  <span className="text-gray-900 font-bold">Total Pembayaran</span>
                  <span className="text-2xl font-black text-red-600">{formatCurrency(currentTotalAmount)}</span>
                </div>
              </div>

              {/* TOMBOL BAYAR UTAMA */}
              <button 
                onClick={handlePlaceOrderAndPay}
                disabled={isProcessing || !selectedAddress || ! scheduledAt || !customerContact.phone.trim()}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2 ${
                  isProcessing || ! selectedAddress || !scheduledAt || !customerContact.phone.trim()
                    ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                    : 'bg-red-600 hover:bg-red-700 shadow-red-200 hover:-translate-y-1'
                }`}
              >
                {isProcessing ?  (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

              <p className="text-xs text-gray-500 text-center">
                Dengan melanjutkan, Anda menyetujui Syarat & Ketentuan Posko.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// Wrapper untuk Suspense
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