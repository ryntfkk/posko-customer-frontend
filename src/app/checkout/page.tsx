// src/app/checkout/page.tsx
'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, useRef, Suspense, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { fetchServices } from '@/features/services/api';
import { fetchProviderById } from '@/features/providers/api';
import { Service, getUnitLabel } from '@/features/services/types';
import { Provider } from '@/features/providers/types';
import { getCartItemId, useCart } from '@/features/cart/useCart';

// --- UTILS ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDuration = (minutes?: number): string => {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const remainMins = minutes % 60;
  if (remainMins === 0) return `${hours} jam`;
  return `${hours} jam ${remainMins} menit`;
};

// --- TYPES ---
type CheckoutType = 'basic' | 'direct';

interface CheckoutOption {
  id: string;
  name: string;
  category: string;
  description: string;
  shortDescription?: string;
  price: number;
  unit: string;
  unitLabel?: string;
  displayUnit?: string;
  estimatedDuration?: number;
  includes?: string[];
  excludes?: string[];
  isPromo?: boolean;
  promoPrice?: number;
  discountPercent?: number;
}

// --- SUB-COMPONENTS (MEMOIZED) ---

// 1. Service Card Component (Dioptimalkan agar tidak re-render masal)
const ServiceCard = memo(({ 
  option, 
  quantity, 
  onUpdateQuantity, 
  onShowDetail,
  disabled 
}: { 
  option: CheckoutOption; 
  quantity: number; 
  onUpdateQuantity: (newQty: number) => void; 
  onShowDetail: (opt: CheckoutOption) => void;
  disabled: boolean;
}) => {
  const durationText = formatDuration(option.estimatedDuration);

  return (
    <div className={`relative flex gap-3 md:gap-4 p-3 md:p-4 border rounded-2xl transition-all ${
      quantity > 0 ? 'border-red-600 bg-red-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-400'
    }`}>
      {/* Badge Promo */}
      {option.isPromo && option.discountPercent && option.discountPercent > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-md z-10">
          -{option.discountPercent}%
        </div>
      )}

      <div className="flex-1 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base md:text-lg font-bold text-gray-900 leading-tight">{option.name}</h3>
              <span className="text-[10px] md:text-[11px] font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                {option.category}
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-600 line-clamp-2 mt-1">
              {option.shortDescription || option.description}
            </p>
          </div>
        </div>

        {/* Info Badges */}
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          {durationText && (
            <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-500">
              <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{durationText}</span>
            </div>
          )}
          {option.includes && option.includes.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] md:text-xs text-green-600">
              <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{option.includes.length} termasuk</span>
            </div>
          )}
          <button
            onClick={() => onShowDetail(option)}
            className="text-[10px] md:text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
          >
            Lihat Detail →
          </button>
        </div>

        {/* Harga */}
        <div className="flex items-end gap-1.5 md:gap-2">
          {option.isPromo && option.promoPrice ? (
            <>
              <p className="text-base md:text-lg font-black text-red-700">{formatCurrency(option.promoPrice)}</p>
              <p className="text-xs md:text-sm text-gray-400 line-through">{formatCurrency(option.price)}</p>
            </>
          ) : (
            <p className="text-base md:text-lg font-black text-red-700">{formatCurrency(option.price)}</p>
          )}
          <span className="text-[10px] md:text-xs text-gray-500 mb-0.5">{option.displayUnit}</span>
        </div>
      </div>

      {/* Quantity Controls */}
      <div className="flex flex-col items-center justify-center gap-1 md:gap-2">
        <button
          onClick={() => onUpdateQuantity(quantity + 1)}
          disabled={disabled}
          className={`w-8 h-8 md:w-10 md:h-10 rounded-lg font-bold flex items-center justify-center text-sm md:text-lg ${
            disabled
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          +
        </button>
        <span className="text-sm md:text-xl font-black text-gray-900 w-6 md:w-8 text-center">{quantity}</span>
        <button
          onClick={() => onUpdateQuantity(Math.max(0, quantity - 1))}
          className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white border border-gray-200 hover:border-gray-400 flex items-center justify-center font-bold text-gray-600 text-sm md:text-lg"
        >
          -
        </button>
      </div>
    </div>
  );
});
ServiceCard.displayName = 'ServiceCard';

// 2. Detail Modal Component
const DetailModal = ({ option, onClose }: { option: CheckoutOption; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-3 md:p-4 border-b border-gray-100 flex justify-between items-start shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                {option.category}
              </span>
              {option.isPromo && (
                <span className="text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded-full">PROMO</span>
              )}
            </div>
            <h3 className="font-bold text-base md:text-lg text-gray-900">{option.name}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Content */}
        <div className="p-3 md:p-4 space-y-4 overflow-y-auto">
          <div className="flex items-end justify-between bg-gray-50 p-3 md:p-4 rounded-xl">
            <div>
              <p className="text-[10px] md:text-xs text-gray-500 mb-1">Harga</p>
              <div className="flex items-end gap-2">
                {option.isPromo && option.promoPrice ? (
                  <>
                    <span className="text-xl md:text-2xl font-black text-red-600">{formatCurrency(option.promoPrice)}</span>
                    <span className="text-xs md:text-sm text-gray-400 line-through">{formatCurrency(option.price)}</span>
                  </>
                ) : (
                  <span className="text-xl md:text-2xl font-black text-gray-900">{formatCurrency(option.price)}</span>
                )}
              </div>
              <p className="text-[10px] md:text-xs text-gray-500 mt-1">{option.displayUnit}</p>
            </div>
            {option.estimatedDuration && (
              <div className="text-right">
                <p className="text-[10px] md:text-xs text-gray-500 mb-1">Estimasi</p>
                <p className="text-sm font-bold text-gray-900">{formatDuration(option.estimatedDuration)}</p>
              </div>
            )}
          </div>
          <div>
            <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-2">Deskripsi</p>
            <p className="text-sm text-gray-700 leading-relaxed">{option.description}</p>
          </div>
          {option.includes && option.includes.length > 0 && (
            <div>
              <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-2">✓ Termasuk</p>
              <ul className="space-y-1.5">
                {option.includes.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {option.excludes && option.excludes.length > 0 && (
            <div>
              <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-2">✗ Tidak Termasuk</p>
              <ul className="space-y-1.5">
                {option.excludes.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="p-3 md:p-4 bg-gray-50 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="w-full py-3 bg-gray-900 text-white font-bold text-sm rounded-xl hover:bg-gray-800 transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN CONTENT ---
function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Custom Hook Cart (Sudah dioptimasi di langkah sebelumnya)
  const { cart, upsertItem, clearCart, isHydrated, checkConflict, resetAndAddItem } = useCart();

  // Local State
  const [services, setServices] = useState<Service[]>([]);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // UI State
  const [selectedDetail, setSelectedDetail] = useState<CheckoutOption | null>(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<any>(null);

  // URL Params Derivation
  const categoryParam = searchParams?.get('category') || null;
  const serviceIdParam = searchParams?.get('serviceId');
  const typeParam = searchParams?.get('type') as CheckoutType | null;
  const providerIdParam = searchParams?.get('providerId');
  
  const checkoutType: CheckoutType = typeParam === 'direct' ? 'direct' : 'basic';
  const selectedProviderId = providerIdParam || null;

  // Ref untuk Auto-Add (Track execution)
  const autoAddExecuted = useRef(false);

  // 1. Fetch Data Effect
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (checkoutType === 'basic') {
          const res = await fetchServices(categoryParam);
          if (isMounted) setServices(res.data);
        } else if (checkoutType === 'direct' && selectedProviderId) {
          const res = await fetchProviderById(selectedProviderId);
          if (isMounted) setProvider(res.data);
        }
      } catch (err) {
        if (isMounted) setError('Gagal memuat data layanan. Silakan coba lagi.');
        console.error(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [checkoutType, selectedProviderId, categoryParam]);

  // 2. Data Normalization (Memoized)
  const availableOptions: CheckoutOption[] = useMemo(() => {
    if (checkoutType === 'basic') {
      return services.map(s => ({
        id: s._id,
        name: s.name,
        category: s.category,
        description: s.description || 'Layanan standar aplikasi.',
        shortDescription: s.shortDescription,
        price: s.displayPrice || s.basePrice,
        unit: s.unit || 'unit',
        unitLabel: s.unitLabel,
        displayUnit: s.displayUnit || getUnitLabel(s.unit || 'unit', s.unitLabel),
        estimatedDuration: s.estimatedDuration,
        includes: s.includes,
        excludes: s.excludes,
        isPromo: s.isPromo,
        promoPrice: s.promoPrice,
        discountPercent: s.discountPercent,
      }));
    } else {
      if (!provider) return [];
      return provider.services
        .filter(item => item.isActive)
        .map(item => ({
          id: item.serviceId._id,
          name: item.serviceId.name,
          category: item.serviceId.category,
          description: item.serviceId.description || `Layanan oleh ${provider.userId.fullName}`,
          shortDescription: item.serviceId.shortDescription,
          price: item.price,
          unit: item.serviceId.unit || 'unit',
          unitLabel: item.serviceId.unitLabel,
          displayUnit: item.serviceId.displayUnit || getUnitLabel(item.serviceId.unit || 'unit', item.serviceId.unitLabel),
          estimatedDuration: item.serviceId.estimatedDuration,
          includes: item.serviceId.includes,
          excludes: item.serviceId.excludes,
          isPromo: item.serviceId.isPromo,
          promoPrice: item.serviceId.promoPrice,
          discountPercent: item.serviceId.discountPercent,
        }));
    }
  }, [checkoutType, services, provider]);

  const providerLabel = useMemo(() => {
    if (!selectedProviderId) return 'Cari Cepat';
    if (provider) return provider.userId.fullName;
    return 'Memuat...';
  }, [selectedProviderId, provider]);

  // 3. Auto-Add Logic (Robust & Clean)
  useEffect(() => {
    // Jalankan hanya jika data sudah siap, cart sudah hydrated, dan belum pernah dijalankan
    if (!isHydrated || isLoading || availableOptions.length === 0) return;
    if (autoAddExecuted.current) return;
    if (!serviceIdParam) return;

    const targetOption = availableOptions.find(o => o.id === serviceIdParam);
    if (targetOption) {
      const itemPayload = {
          serviceId: targetOption.id,
          serviceName: targetOption.name,
          category: targetOption.category,
          orderType: checkoutType,
          quantity: 1,
          pricePerUnit: targetOption.price,
          providerId: checkoutType === 'direct' ? selectedProviderId || undefined : undefined,
          providerName: checkoutType === 'direct' ? providerLabel : undefined,
      };

      // Cek konflik dengan item di cart saat ini
      if (checkConflict(itemPayload)) {
          setPendingItem(itemPayload);
          setIsConflictModalOpen(true);
      } else {
          upsertItem(itemPayload);
      }
      
      // Tandai sudah dieksekusi agar tidak loop
      autoAddExecuted.current = true;

      // Bersihkan URL tanpa refresh page
      const newParams = new URLSearchParams(window.location.search);
      newParams.delete('serviceId');
      window.history.replaceState(null, '', `?${newParams.toString()}`);
    }
  }, [isHydrated, isLoading, availableOptions, serviceIdParam, checkoutType, selectedProviderId, providerLabel, checkConflict, upsertItem]);

  // 4. Computed Cart Summary
  const activeCartItems = useMemo(() => {
    return cart.filter((item) => {
      if (item.quantity <= 0) return false;
      if (checkoutType === 'basic') {
        if (item.orderType !== 'basic') return false;
        // Opsional: filter kategori jika perlu strict
        if (categoryParam && (item.category ?? '').toLowerCase() !== categoryParam.toLowerCase()) {
           // return false; // Uncomment jika ingin strict per kategori
        }
        return true;
      } else {
        return item.orderType === 'direct' && item.providerId === selectedProviderId;
      }
    });
  }, [cart, checkoutType, selectedProviderId, categoryParam]);

  const currentTotalAmount = activeCartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const currentTotalItems = activeCartItems.reduce((sum, item) => sum + item.quantity, 0);

  // --- HANDLERS ---
  const handleUpdateQuantity = (option: CheckoutOption, newQuantity: number) => {
    const itemPayload = {
      serviceId: option.id,
      serviceName: option.name,
      category: option.category,
      orderType: checkoutType,
      quantity: newQuantity,
      pricePerUnit: option.price,
      providerId: checkoutType === 'direct' ? selectedProviderId || undefined : undefined,
      providerName: checkoutType === 'direct' ? providerLabel : undefined,
    };

    if (newQuantity > 0 && checkConflict(itemPayload)) {
       setPendingItem(itemPayload);
       setIsConflictModalOpen(true);
       return;
    }
    upsertItem(itemPayload);
  };

  const handleConfirmReplaceCart = () => {
    if (pendingItem) {
        resetAndAddItem(pendingItem);
        setPendingItem(null);
        setIsConflictModalOpen(false);
    }
  };

  const handleConfirmOrder = () => {
    if (!isHydrated) return;
    if (activeCartItems.length === 0) {
      alert('Pilih minimal satu layanan.');
      return;
    }
    setIsSubmitting(true);
    const queryParams = new URLSearchParams({ type: checkoutType });
    if (checkoutType === 'basic' && categoryParam) queryParams.append('category', categoryParam);
    if (checkoutType === 'direct' && selectedProviderId) queryParams.append('providerId', selectedProviderId);
    
    router.push(`/order/summary?${queryParams.toString()}`);
  };

  const handleSwitchMode = (target: CheckoutType) => {
    if (target === 'direct' && !selectedProviderId) {
      alert("Pilih mitra terlebih dahulu.");
      return;
    }
    autoAddExecuted.current = false; // Reset flag jika user switch manual
    const params = new URLSearchParams();
    params.set('type', target);
    if (target === 'basic' && categoryParam) params.set('category', categoryParam);
    // Kita reset ke base checkout tanpa ID spesifik
    router.replace(`/checkout?${params.toString()}`);
  };

  // --- RENDER HELPERS ---
  const getQty = (id: string) => {
    const itemId = getCartItemId(id, checkoutType, selectedProviderId);
    return cart.find(c => c.id === itemId)?.quantity || 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 py-3 md:py-4 flex items-center gap-3 md:gap-4">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-red-600">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
              {checkoutType === 'direct' ? 'Pesan Mitra' : 'Pesan Cepat'}
            </h1>
            <p className="text-[10px] md:text-xs text-gray-500">
              {checkoutType === 'direct' ? `Order ke: ${providerLabel}` : 'Sistem akan mencarikan mitra terdekat'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 lg:px-8 py-4 md:py-8 space-y-4 md:space-y-6">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500">Memuat data layanan...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-center font-medium text-sm">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <>
            <section className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              {/* Mode Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 border-b border-gray-50 pb-4">
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Mode Pemesanan</p>
                  <p className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${checkoutType === 'direct' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                    {checkoutType === 'direct' ? 'Direct Order' : 'Basic Order'}
                  </p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                  <button
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${checkoutType === 'basic' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                    onClick={() => handleSwitchMode('basic')}
                  >
                    Basic
                  </button>
                  <button
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${checkoutType === 'direct' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                    onClick={() => handleSwitchMode('direct')}
                  >
                    Direct
                  </button>
                </div>
              </div>

              {/* Grid Content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
                {/* List Services */}
                <div className="md:col-span-2 space-y-3">
                  {checkoutType === 'direct' && provider && (
                    <div className="flex items-start gap-3 p-3 mb-2 bg-blue-50/50 border border-blue-100 rounded-2xl">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white bg-gray-200 shrink-0">
                        <Image
                          src={provider.userId.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider.userId.fullName}`}
                          alt={provider.userId.fullName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase">Mitra Pilihan</span>
                        <h3 className="text-base font-bold text-gray-900 mt-1">{provider.userId.fullName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-gray-600">★ {provider.rating ? provider.rating.toFixed(1) : 'New'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-gray-900">Pilih Layanan</p>
                    <p className="text-[10px] text-gray-500">{availableOptions.length} layanan</p>
                  </div>
                  
                  {availableOptions.map((option) => (
                    <ServiceCard
                      key={option.id}
                      option={option}
                      quantity={getQty(option.id)}
                      onUpdateQuantity={(qty) => handleUpdateQuantity(option, qty)}
                      onShowDetail={setSelectedDetail}
                      disabled={checkoutType === 'direct' && !provider}
                    />
                  ))}
                </div>

                {/* Cart Summary (Sticky) */}
                <div className="p-4 border border-gray-200 rounded-2xl bg-gray-50/50 sticky top-24 space-y-3">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <p className="text-xs font-bold text-gray-900">Ringkasan</p>
                    {activeCartItems.length > 0 && (
                      <button onClick={clearCart} className="text-[10px] text-red-600 font-bold hover:underline">Hapus Semua</button>
                    )}
                  </div>

                  {activeCartItems.length === 0 ? (
                    <div className="text-center py-6 text-gray-400">
                      <p className="text-[10px]">Keranjang kosong</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {activeCartItems.map((item) => (
                        <div key={item.id} className="flex justify-between gap-2 text-[11px] group">
                          <div>
                            <p className="font-semibold text-gray-800">{item.serviceName}</p>
                            <p className="text-gray-500">{item.quantity} x {formatCurrency(item.pricePerUnit)}</p>
                          </div>
                          <div className="font-bold text-gray-900">{formatCurrency(item.totalPrice)}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-sm font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-red-600">{formatCurrency(currentTotalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom Bar (Mobile/Desktop) */}
            <section className="sticky bottom-0 bg-white p-4 lg:p-6 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 z-30">
              <div className="w-full sm:w-auto flex justify-between sm:block">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Total Pembayaran</span>
                <p className="text-xl font-black text-gray-900">{formatCurrency(currentTotalAmount)}</p>
              </div>
              <button
                onClick={handleConfirmOrder}
                disabled={isSubmitting || activeCartItems.length === 0}
                className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-white flex justify-center items-center gap-2 ${
                  isSubmitting || activeCartItems.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isSubmitting ? 'Memproses...' : 'Lanjutkan Pembayaran'}
              </button>
            </section>
          </>
        )}
      </main>

      {selectedDetail && <DetailModal option={selectedDetail} onClose={() => setSelectedDetail(null)} />}

      {isConflictModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-5 text-center space-y-3">
              <h3 className="text-lg font-bold text-gray-900">Ganti Keranjang?</h3>
              <p className="text-sm text-gray-600">Item ini dari kategori atau mitra berbeda. Melanjutkan akan menghapus keranjang saat ini.</p>
            </div>
            <div className="p-4 bg-gray-50 grid grid-cols-2 gap-3">
              <button onClick={() => { setIsConflictModalOpen(false); setPendingItem(null); }} className="px-4 py-2 rounded-xl font-bold text-gray-700 bg-white border">Batal</button>
              <button onClick={handleConfirmReplaceCart} className="px-4 py-2 rounded-xl font-bold text-white bg-red-600">Ya, Ganti</button>
            </div>
          </div>
        </div>
      )}
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