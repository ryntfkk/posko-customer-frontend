// src/app/checkout/page.tsx
'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { fetchServices } from '@/features/services/api';
import { fetchProviderById } from '@/features/providers/api'; 
import { Service } from '@/features/services/types';
import { Provider } from '@/features/providers/types';
import { getCartItemId, useCart } from '@/features/cart/useCart';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

type CheckoutType = 'basic' | 'direct';

interface CheckoutOption {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { cart, upsertItem, clearCart, isHydrated } = useCart();

  // State Data
  const [services, setServices] = useState<Service[]>([]); 
  const [provider, setProvider] = useState<Provider | null>(null); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [checkoutType, setCheckoutType] = useState<CheckoutType>('basic');
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref untuk mencegah infinite loop - DIPERBAIKI dengan mounted flag
  const hasAutoAdded = useRef(false);
  const isMounted = useRef(true);

  const categoryParam = searchParams?. get('category') || null;

  // =====================================================================
  // EFFECT 1: Sinkronisasi Query Params & State
  // =====================================================================
  useEffect(() => {
    if (!searchParams) return;

    const typeParam = searchParams.get('type') as CheckoutType | null;
    const providerParam = searchParams.get('providerId');

    setCheckoutType(typeParam === 'direct' ? 'direct' : 'basic');
    setSelectedProviderId(providerParam);
  }, [searchParams]);

  // =====================================================================
  // EFFECT 2: Fetch Services atau Provider Detail
  // =====================================================================
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (checkoutType === 'basic') {
          const res = await fetchServices(categoryParam);
          // PERBAIKAN: Pastikan res.data adalah array
          const servicesArray = Array.isArray(res.data) ? res.data : [];
          if (isMounted.current) {
            setServices(servicesArray);
          }
        } else if (checkoutType === 'direct' && selectedProviderId) {
          const res = await fetchProviderById(selectedProviderId);
          if (isMounted.current) {
            setProvider(res. data);
          }
        }
      } catch (err) {
        console.error(err);
        if (isMounted.current) {
          setError('Gagal memuat data layanan. Silakan coba lagi.');
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    if (checkoutType === 'basic' || (checkoutType === 'direct' && selectedProviderId)) {
      loadData();
    }
  }, [checkoutType, selectedProviderId, categoryParam]);

  // =====================================================================
  // EFFECT 3: Auto-Add Service dari URL (DIPERBAIKI - NO RACE CONDITION)
  // =====================================================================
  useEffect(() => {
    if (!searchParams) return;

    const autoAddService = async () => {
      if (!isMounted.current || !isHydrated) return;
      
      const serviceIdParam = searchParams.get('serviceId');
      const availableOptions = useMemo(
        () => generateAvailableOptions(),
        [checkoutType, services, provider]
      );

      if (isHydrated && availableOptions.length > 0 && serviceIdParam && !hasAutoAdded.current) {
        const targetOption = availableOptions.find(o => o.id === serviceIdParam);
        
        if (targetOption) {
          const key = getCartItemId(
            targetOption.id, 
            checkoutType, 
            checkoutType === 'direct' ?  selectedProviderId : undefined
          );
          const existing = cart.find(c => c.id === key);

          if (!existing || existing.quantity === 0) {
            upsertItem({
              serviceId: targetOption.id,
              serviceName: targetOption.name,
              category: targetOption.category,
              orderType: checkoutType,
              quantity: 1,
              pricePerUnit: targetOption.price,
              providerId: checkoutType === 'direct' ?  selectedProviderId || undefined : undefined,
              providerName: checkoutType === 'direct' ? getProviderLabel() : undefined,
            });
          }
          
          hasAutoAdded.current = true;
          
          // Bersihkan URL parameter serviceId
          if (isMounted.current) {
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete('serviceId');
            window.history.replaceState(null, '', `?${newParams.toString()}`);
          }
        }
      }
    };

    autoAddService();
  }, [isHydrated, searchParams, checkoutType, selectedProviderId, cart, upsertItem]);

  // =====================================================================
  // EFFECT 4: Cleanup on Unmount
  // =====================================================================
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // =====================================================================
  // HELPER FUNCTIONS
  // =====================================================================
  const generateAvailableOptions = (): CheckoutOption[] => {
    if (checkoutType === 'basic') {
      return services.map(s => ({
        id: s._id,
        name: s. name,
        category: s. category,
        description: s.description || 'Layanan standar aplikasi.',
        price: s.basePrice
      }));
    } else {
      if (!provider) return [];
      
      return provider.services
        .filter(item => item.isActive)
        .map(item => ({
          id: item. serviceId._id,
          name: item. serviceId.name,
          category: item.serviceId.category,
          description: `Layanan spesifik oleh ${provider.userId. fullName}`,
          price: item.price 
        }));
    }
  };

  const getProviderLabel = (): string => {
    if (! selectedProviderId) return 'Cari Cepat';
    if (provider) return provider.userId.fullName;
    return 'Memuat Nama Mitra...';
  };

  const availableOptions = useMemo(() => generateAvailableOptions(), [checkoutType, services, provider]);
  const providerLabel = useMemo(() => getProviderLabel(), [selectedProviderId, provider]);

  // Filter keranjang agar HANYA menampilkan item yang sesuai dengan mode saat ini
  const activeCartItems = useMemo(() => {
    return cart.filter((item) => {
      if (item.quantity <= 0) return false;
      
      if (checkoutType === 'basic') {
        if (item.orderType !== 'basic') return false;
        if (categoryParam) {
          return (item.category ??  null) === categoryParam;
        }
        return true;
      } else {
        return item.orderType === 'direct' && item.providerId === selectedProviderId;
      }
    });
  }, [cart, checkoutType, selectedProviderId, categoryParam]);

  const currentTotalAmount = activeCartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const currentTotalItems = activeCartItems.reduce((sum, item) => sum + item.quantity, 0);

  const getQuantityForService = (serviceId: string) => {
    const key = getCartItemId(serviceId, checkoutType, checkoutType === 'direct' ? selectedProviderId : undefined);
    const existing = cart.find((item) => item.id === key);
    return existing?.quantity ??  0;
  };

  const handleConfirmOrder = async () => {
    if (! isHydrated) return;
    
    if (activeCartItems.length === 0 || currentTotalItems <= 0) {
      alert('Pilih minimal satu layanan sebelum melanjutkan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const queryParams = new URLSearchParams({
        type: checkoutType,
      });
      
      if (checkoutType === 'basic' && categoryParam) {
        queryParams. append('category', categoryParam);
      }

      if (checkoutType === 'direct' && selectedProviderId) {
        queryParams.append('providerId', selectedProviderId);
      }

      router.push(`/order/summary?${queryParams.toString()}`);
    } catch (err) {
      console.error(err);
      alert('Terjadi kendala.  Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchMode = (targetMode: CheckoutType) => {
    if (targetMode === 'direct' && ! selectedProviderId) {
      alert('Silakan pilih mitra dari halaman pencarian terlebih dahulu.');
      return;
    }
    
    hasAutoAdded.current = false;
    setCheckoutType(targetMode);
    
    if (targetMode === 'basic') {
      setSelectedProviderId(null);
      router.replace('/checkout? type=basic');
    }
  };

  const renderServiceOption = (option: CheckoutOption) => {
    const quantity = getQuantityForService(option.id);

    const handleUpdateQuantity = (newQuantity: number) => {
      upsertItem({
        serviceId: option.id,
        serviceName: option.name,
        category: option.category,
        orderType: checkoutType,
        quantity: newQuantity,
        pricePerUnit: option. price,
        providerId: checkoutType === 'direct' ?  selectedProviderId || undefined : undefined,
        providerName: checkoutType === 'direct' ? providerLabel : undefined,
      });
    };

    return (
      <div
        key={option.id}
        className={`flex gap-4 p-4 border rounded-2xl transition-all ${
          quantity > 0 ? 'border-red-600 bg-red-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-400'
        }`}
      >
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-gray-900">{option.name}</h3>
            <span className="text-[12px] font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
              {option.category}
            </span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{option.description}</p>
          <p className="text-base font-black text-red-700">{formatCurrency(option.price)}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleUpdateQuantity(Math.max(0, quantity - 1))}
            className="w-10 h-10 rounded-lg bg-white border border-gray-200 hover:border-gray-400 flex items-center justify-center font-bold text-gray-600"
          >
            -
          </button>
          <span className="text-xl font-black text-gray-900 w-8 text-center">{quantity}</span>
          <button
            onClick={() => handleUpdateQuantity(quantity + 1)}
            disabled={checkoutType === 'direct' && !provider}
            className={`w-10 h-10 rounded-lg font-bold flex items-center justify-center ${
              checkoutType === 'direct' && !provider
                ?  'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            +
          </button>
        </div>
      </div>
    );
  };

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
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Checkout</span>
            <h1 className="text-xl font-bold text-gray-900">{checkoutType === 'direct' ? 'Pesan Mitra' : 'Pesan Cepat'}</h1>
            <p className="text-xs text-gray-500 truncate max-w-[200px]">
              {checkoutType === 'direct' ? `Order ke: ${providerLabel}` : 'Sistem akan mencarikan mitra terdekat'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 lg:px-8 py-8 space-y-6">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500">Memuat data layanan...</p>
          </div>
        )}
        
        {error && (
          <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-center font-medium">
            {error}
          </div>
        )}

        {! isLoading && !error && (
          <>
            <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              {/* Header Section Tipe Order */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 pb-4">
                <div>
                  <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Mode Pemesanan</p>
                  <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    {checkoutType === 'direct' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Direct Order (Pilih Mitra)
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Basic Order (Otomatis)
                      </>
                    )}
                  </p>
                </div>
                
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                      checkoutType === 'basic'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                    onClick={() => handleSwitchMode('basic')}
                  >
                    Basic
                  </button>
                  <button
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                      checkoutType === 'direct'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                    onClick={() => handleSwitchMode('direct')}
                  >
                    Direct
                  </button>
                </div>
              </div>

              {/* Grid Content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* Kolom Kiri: Daftar Layanan */}
                <div className="md:col-span-2 space-y-4">
                  
                  {checkoutType === 'direct' && provider && (
                    <div className="flex items-start gap-4 p-4 mb-2 bg-blue-50/50 border border-blue-100 rounded-2xl animate-fadeIn">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0 bg-gray-200">
                        <Image 
                          src={provider.userId.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider.userId.fullName}`} 
                          alt={provider.userId.fullName} 
                          fill 
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">Mitra Pilihan</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{provider.userId.fullName}</h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{provider.userId.bio || 'Mitra profesional Posko siap melayani kebutuhan Anda.'}</p>
                        
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-sm">
                            <span className="text-xs text-yellow-500">★</span>
                            <span className="text-xs font-bold text-gray-700">{provider.rating ?  provider.rating.toFixed(1) : 'New'}</span>
                          </div>
                          <span className="text-[10px] text-gray-400">•</span>
                          <span className="text-xs text-gray-600 font-medium">Harga Ratecard Khusus</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-gray-900">Pilih Layanan</p>
                  </div>

                  {checkoutType === 'direct' && availableOptions.length === 0 && (
                    <div className="p-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      <p className="text-sm text-gray-500">Mitra ini belum memiliki layanan aktif yang dapat dipesan.</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {availableOptions.map((option) => renderServiceOption(option))}
                  </div>
                </div>

                {/* Kolom Kanan: Ringkasan Keranjang */}
                <div className="p-5 border border-gray-200 rounded-2xl bg-gray-50/50 sticky top-24 space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <p className="text-sm font-bold text-gray-900">Ringkasan Pesanan</p>
                    {activeCartItems.length > 0 && (
                      <button onClick={clearCart} className="text-[10px] text-red-600 font-bold hover:underline">Hapus Semua</button>
                    )}
                  </div>
                  
                  {!isHydrated ? (
                    <p className="text-sm text-gray-500 animate-pulse">Memuat keranjang...</p>
                  ) : activeCartItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                      <p className="text-xs">Keranjang kosong</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                      {activeCartItems.map((item) => (
                        <div key={item.id} className="flex justify-between gap-2 text-sm group">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-gray-800 leading-tight">{item.serviceName}</p>
                            <p className="text-[10px] text-gray-500">
                              {item.orderType === 'direct' ? 'Direct' : 'Basic'} 
                              {item.providerName ? ` • ${item.providerName}` : ''}
                            </p>
                            <p className="text-[11px] text-gray-500">{item.quantity} x {formatCurrency(item.pricePerUnit)}</p>
                          </div>
                          <div className="text-right font-bold text-gray-900">
                            {formatCurrency(item.totalPrice)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-3 space-y-1">
                    <div className="flex items-center justify-between text-sm font-bold text-gray-900">
                      <span>Total Estimasi</span>
                      <span className="text-red-600">{formatCurrency(currentTotalAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span>Jumlah Layanan</span>
                      <span>{currentTotalItems} Item</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom Action Bar */}
            <section className="sticky bottom-4 bg-white p-4 lg:p-6 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 z-30">
              <div className="text-center sm:text-left w-full sm:w-auto">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Pembayaran</span>
                <p className="text-2xl lg:text-3xl font-black text-gray-900">{formatCurrency(currentTotalAmount)}</p>
              </div>
              <button
                onClick={handleConfirmOrder}
                disabled={isSubmitting || activeCartItems.length === 0}
                className={`w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white flex justify-center items-center gap-2 shadow-lg shadow-red-200 transition-all active:scale-95 ${
                  isSubmitting || activeCartItems.length === 0
                    ? 'bg-gray-300 cursor-not-allowed shadow-none'
                    : 'bg-red-600 hover:bg-red-700 hover:-translate-y-1'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Memproses...
                  </>
                ) : (
                  <>
                    Lanjutkan Pembayaran
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default function CheckoutPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>}>
      <CheckoutContent />
    </Suspense>
  );
}