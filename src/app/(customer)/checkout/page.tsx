// src/app/(customer)/checkout/page.tsx
'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, useRef, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { fetchServices } from '@/features/services/api';
import { fetchProviderById } from '@/features/providers/api';
import { fetchProfile } from '@/features/auth/api';
import { Service, getUnitLabel, getQuantityLabel } from '@/features/services/types';
import { Provider } from '@/features/providers/types';
import { User, Address, GeoLocation } from '@/features/auth/types';
import { getCartItemId, useCart } from '@/features/cart/useCart';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Helper untuk format durasi
const formatDuration = (minutes?: number): string => {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const remainMins = minutes % 60;
  if (remainMins === 0) return `${hours} jam`;
  return `${hours} jam ${remainMins} menit`;
};

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

// Komponen Content dipisah agar bisa dibungkus Suspense
function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { cart, upsertItem, clearCart, isHydrated } = useCart();

  // State Data
  const [services, setServices] = useState<Service[]>([]);
  const [provider, setProvider] = useState<Provider | null>(null);

  // [BARU] State untuk User Profile, Alamat, dan Lokasi
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<GeoLocation | null>(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [tempLat, setTempLat] = useState<string>('');
  const [tempLng, setTempLng] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [checkoutType, setCheckoutType] = useState<CheckoutType>('basic');
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State untuk modal detail
  const [selectedDetail, setSelectedDetail] = useState<CheckoutOption | null>(null);

  // Ref untuk mencegah infinite loop saat auto-add
  const hasAutoAdded = useRef(false);

  // [FIX] State untuk menyimpan kategori yang terdeteksi dari provider
  const [detectedCategory, setDetectedCategory] = useState<string | null>(null);

  const categoryParam = searchParams?.get('category') || null;

  // [FIX] Kategori efektif yang akan digunakan (dari URL atau dari deteksi provider)
  const effectiveCategory = categoryParam || detectedCategory;

  // [BARU] Load User Profile & Set Default Alamat/Lokasi
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetchProfile();
        const profile = res.data.profile;
        setUserProfile(profile);

        // Set alamat dan lokasi default dari profile user
        if (profile.address) {
          setSelectedAddress(profile.address);
        }
        if (profile.location && profile.location.coordinates && profile.location.coordinates[0] !== 0) {
          setSelectedLocation(profile.location);
          setTempLat(profile.location.coordinates[1].toString());
          setTempLng(profile.location.coordinates[0].toString());
        }
      } catch (error) {
        console.error("Gagal memuat profil:", error);
        // Tidak redirect, biarkan user tetap bisa browse
      } finally {
        setIsProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  // 1.Sinkronisasi Query Params & State
  useEffect(() => {
    if (! searchParams) return;

    const typeParam = searchParams.get('type') as CheckoutType | null;
    const providerParam = searchParams.get('providerId');

    setCheckoutType(typeParam === 'direct' ?  'direct' : 'basic');
    setSelectedProviderId(providerParam);
  }, [searchParams]);

  // 2.Fetch Data Berdasarkan Tipe Order
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (checkoutType === 'basic') {
          // [FIX] Gunakan effectiveCategory untuk filter layanan
          const res = await fetchServices(effectiveCategory);
          setServices(res.data);
        } else if (checkoutType === 'direct' && selectedProviderId) {
          const res = await fetchProviderById(selectedProviderId);
          setProvider(res.data);
          
          // [FIX] Deteksi kategori dari layanan provider saat mode direct
          // Ambil kategori pertama dari layanan aktif provider
          const activeServices = res.data.services?.filter((s: { isActive: boolean }) => s.isActive) || [];
          if (activeServices.length > 0 && activeServices[0].serviceId?.category) {
            setDetectedCategory(activeServices[0].serviceId.category);
          }
        }
      } catch (err) {
        console.error(err);
        setError('Gagal memuat data layanan. Silakan coba lagi.');
      } finally {
        setIsLoading(false);
      }
    };

    if (checkoutType === 'basic' || (checkoutType === 'direct' && selectedProviderId)) {
      loadData();
    }
  }, [checkoutType, selectedProviderId, effectiveCategory]);

  // 3. Normalisasi Data untuk UI
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
      if (! provider) return [];

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
    return 'Memuat Nama Mitra...';
  }, [selectedProviderId, provider]);

  // Filter keranjang
  const activeCartItems = useMemo(() => {
    return cart.filter((item) => {
      if (item.quantity <= 0) return false;

      if (checkoutType === 'basic') {
        if (item.orderType !== 'basic') return false;
        // [FIX] Gunakan effectiveCategory untuk filter keranjang
        if (effectiveCategory) {
          // Case-insensitive comparison untuk kategori
          const itemCategory = (item.category ??  '').toLowerCase();
          const filterCategory = effectiveCategory.toLowerCase();
          return itemCategory === filterCategory;
        }
        return true;
      } else {
        return item.orderType === 'direct' && item.providerId === selectedProviderId;
      }
    });
  }, [cart, checkoutType, selectedProviderId, effectiveCategory]);

  const currentTotalAmount = activeCartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const currentTotalItems = activeCartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Auto-Add Service jika ada `serviceId` di URL
  useEffect(() => {
    if (! searchParams) return;

    const serviceIdParam = searchParams.get('serviceId');

    if (isHydrated && ! hasAutoAdded.current && serviceIdParam && availableOptions.length > 0) {
      const targetOption = availableOptions.find(o => o.id === serviceIdParam);

      if (targetOption) {
        const key = getCartItemId(targetOption.id, checkoutType, checkoutType === 'direct' ? selectedProviderId : undefined);
        const existing = cart.find(c => c.id === key);

        if (!existing || existing.quantity === 0) {
          upsertItem({
            serviceId: targetOption.id,
            serviceName: targetOption.name,
            category: targetOption.category,
            orderType: checkoutType,
            quantity: 1,
            pricePerUnit: targetOption.price,
            providerId: checkoutType === 'direct' ? selectedProviderId || undefined : undefined,
            providerName: checkoutType === 'direct' ? providerLabel : undefined,
          });
        }
        hasAutoAdded.current = true;

        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete('serviceId');
        window.history.replaceState(null, '', `? ${newParams.toString()}`);
      }
    }
  }, [isHydrated, searchParams, availableOptions, checkoutType, selectedProviderId, providerLabel, upsertItem, cart]);

  const getQuantityForService = (serviceId: string) => {
    const key = getCartItemId(serviceId, checkoutType, checkoutType === 'direct' ? selectedProviderId : undefined);
    const existing = cart.find((item) => item.id === key);
    return existing?.quantity ??  0;
  };

  // [BARU] Handler untuk update koordinat
  const handleSaveLocation = useCallback(() => {
    const lat = parseFloat(tempLat);
    const lng = parseFloat(tempLng);

    if (isNaN(lat) || isNaN(lng)) {
      alert('Koordinat tidak valid. Masukkan angka yang benar.');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Koordinat di luar rentang yang valid.');
      return;
    }

    setSelectedLocation({
      type: 'Point',
      coordinates: [lng, lat] // GeoJSON format: [longitude, latitude]
    });
    setIsEditingLocation(false);
  }, [tempLat, tempLng]);

  // [BARU] Handler untuk open Google Maps picker
  const handleOpenMapPicker = useCallback(() => {
    const lat = selectedLocation?.coordinates[1] || -6.9175;
    const lng = selectedLocation?.coordinates[0] || 110.4193;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  }, [selectedLocation]);

  const handleConfirmOrder = async () => {
    if (! isHydrated) return;

    if (activeCartItems.length === 0 || currentTotalItems <= 0) {
      alert('Pilih minimal satu layanan sebelum melanjutkan.');
      return;
    }

    // [BARU] Validasi lokasi sebelum lanjut
    if (! selectedLocation || selectedLocation.coordinates[0] === 0) {
      alert('Mohon tentukan titik lokasi pengerjaan terlebih dahulu.');
      return;
    }

    if (! selectedAddress || ! selectedAddress.city || !selectedAddress.detail) {
      alert('Mohon lengkapi alamat pengerjaan terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const queryParams = new URLSearchParams({
        type: checkoutType,
      });

      // [FIX] Gunakan effectiveCategory untuk URL summary
      if (checkoutType === 'basic' && effectiveCategory) {
        queryParams.append('category', effectiveCategory);
      }

      if (checkoutType === 'direct' && selectedProviderId) {
        queryParams.append('providerId', selectedProviderId);
      }

      router.push(`/order/summary?${queryParams.toString()}`);
    } catch (err) {
      console.error(err);
      alert('Terjadi kendala. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchMode = (targetMode: CheckoutType) => {
    if (targetMode === 'direct' && ! selectedProviderId) {
      alert("Silakan pilih mitra dari halaman pencarian terlebih dahulu.");
      return;
    }

    hasAutoAdded.current = false;

    setCheckoutType(targetMode);
    if (targetMode === 'basic') {
      setSelectedProviderId(null);
      
      // [FIX] Sertakan kategori saat switch ke basic mode
      // Gunakan detectedCategory (dari provider) atau categoryParam (dari URL awal)
      const categoryToUse = detectedCategory || categoryParam;
      if (categoryToUse) {
        router.replace(`/checkout? type=basic&category=${encodeURIComponent(categoryToUse)}`);
      } else {
        router.replace('/checkout? type=basic');
      }
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
        pricePerUnit: option.price,
        providerId: checkoutType === 'direct' ? selectedProviderId || undefined : undefined,
        providerName: checkoutType === 'direct' ? providerLabel : undefined,
      });
    };

    const durationText = formatDuration(option.estimatedDuration);

    return (
      <div
        key={option.id}
        className={`relative flex gap-4 p-4 border rounded-2xl transition-all ${
          quantity > 0 ?  'border-red-600 bg-red-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-400'
        }`}
      >
        {/* Badge Promo */}
        {option.isPromo && option.discountPercent && option.discountPercent > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-md">
            -{option.discountPercent}%
          </div>
        )}

        <div className="flex-1 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900">{option.name}</h3>
                <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                  {option.category}
                </span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                {option.shortDescription || option.description}
              </p>
            </div>
          </div>

          {/* Info Badges */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Durasi */}
            {durationText && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{durationText}</span>
              </div>
            )}

            {/* Includes count */}
            {option.includes && option.includes.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>{option.includes.length} termasuk</span>
              </div>
            )}

            {/* Lihat Detail */}
            <button
              onClick={() => setSelectedDetail(option)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              Lihat Detail →
            </button>
          </div>

          {/* Harga */}
          <div className="flex items-end gap-2">
            {option.isPromo && option.promoPrice ?  (
              <>
                <p className="text-lg font-black text-red-700">{formatCurrency(option.promoPrice)}</p>
                <p className="text-sm text-gray-400 line-through">{formatCurrency(option.price)}</p>
              </>
            ) : (
              <p className="text-lg font-black text-red-700">{formatCurrency(option.price)}</p>
            )}
            <span className="text-xs text-gray-500 mb-0.5">{option.displayUnit}</span>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex flex-col items-center justify-center gap-2">
          <button
            onClick={() => handleUpdateQuantity(quantity + 1)}
            disabled={checkoutType === 'direct' && ! provider}
            className={`w-10 h-10 rounded-lg font-bold flex items-center justify-center text-lg ${
              checkoutType === 'direct' && !provider
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            +
          </button>
          <span className="text-xl font-black text-gray-900 w-8 text-center">{quantity}</span>
          <button
            onClick={() => handleUpdateQuantity(Math.max(0, quantity - 1))}
            className="w-10 h-10 rounded-lg bg-white border border-gray-200 hover:border-gray-400 flex items-center justify-center font-bold text-gray-600 text-lg"
          >
            -
          </button>
        </div>
      </div>
    );
  };

  // Loading state untuk profile
  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500">Memuat data profil...</p>
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
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Checkout</span>
            <h1 className="text-xl font-bold text-gray-900">{checkoutType === 'direct' ? 'Pesan Mitra' : 'Pesan Cepat'}</h1>
            <p className="text-xs text-gray-500 truncate max-w-[200px]">
              {checkoutType === 'direct' ? `Order ke: ${providerLabel}` : 'Sistem akan mencarikan mitra terdekat'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 lg:px-8 py-8 space-y-6">
        
        {/* [BARU] Section Lokasi & Alamat di Bagian Atas */}
        <section className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Lokasi Pengerjaan</p>
                <h2 className="text-base font-bold text-gray-900">Titik Koordinat & Alamat</h2>
              </div>
            </div>
            <button 
              onClick={() => router.push('/profile')}
              className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline"
            >
              Ubah di Profil
            </button>
          </div>

          {/* Koordinat Display */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                </svg>
                <span className="text-xs font-semibold text-gray-600">Titik Lokasi</span>
              </div>
              
              {! isEditingLocation ?  (
                <button 
                  onClick={() => setIsEditingLocation(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                  </svg>
                  Edit Manual
                </button>
              ) : (
                <button 
                  onClick={() => {
                    setIsEditingLocation(false);
                    // Reset ke value sebelumnya
                    if (selectedLocation) {
                      setTempLat(selectedLocation.coordinates[1].toString());
                      setTempLng(selectedLocation.coordinates[0].toString());
                    }
                  }}
                  className="text-xs font-bold text-gray-500 hover:text-gray-700"
                >
                  Batal
                </button>
              )}
            </div>

            {! isEditingLocation ?  (
              // Display Mode
              <div className="space-y-2">
                {selectedLocation && selectedLocation.coordinates[0] !== 0 ?  (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-white px-3 py-2 rounded-lg border border-gray-200">
                        <p className="text-[10px] text-gray-500 uppercase font-medium">Latitude</p>
                        <p className="text-sm font-bold text-gray-900">{selectedLocation.coordinates[1].toFixed(6)}</p>
                      </div>
                      <div className="flex-1 bg-white px-3 py-2 rounded-lg border border-gray-200">
                        <p className="text-[10px] text-gray-500 uppercase font-medium">Longitude</p>
                        <p className="text-sm font-bold text-gray-900">{selectedLocation.coordinates[0].toFixed(6)}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleOpenMapPicker}
                      className="w-full flex items-center justify-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                      </svg>
                      Lihat di Google Maps
                    </button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-gray-900">Titik Lokasi Belum Diatur</p>
                    <p className="text-xs text-gray-500 mt-1">Klik Edit Manual untuk memasukkan koordinat.</p>
                    <button
                      onClick={() => setIsEditingLocation(true)}
                      className="mt-3 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Atur Koordinat Sekarang
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Edit Mode
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 uppercase font-medium">Latitude</label>
                    <input
                      type="text"
                      value={tempLat}
                      onChange={(e) => setTempLat(e.target.value)}
                      placeholder="-6.9175"
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 uppercase font-medium">Longitude</label>
                    <input
                      type="text"
                      value={tempLng}
                      onChange={(e) => setTempLng(e.target.value)}
                      placeholder="110.4193"
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400">
                  💡 Tip: Buka Google Maps, klik kanan pada lokasi, lalu salin koordinat.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveLocation}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Simpan Koordinat
                  </button>
                  <button
                    onClick={() => {
                      // Gunakan Geolocation API
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            setTempLat(position.coords.latitude.toString());
                            setTempLng(position.coords.longitude.toString());
                          },
                          (error) => {
                            alert('Gagal mendapatkan lokasi.Pastikan izin lokasi aktif.');
                          }
                        );
                      } else {
                        alert('Browser tidak mendukung Geolocation.');
                      }
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    </svg>
                    GPS
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Alamat Display */}
          {selectedAddress && selectedAddress.city ?  (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 leading-snug">
                    {userProfile?.fullName} ({selectedAddress.city})
                  </p>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {selectedAddress.detail}
                    {selectedAddress.village && `, Kel. ${selectedAddress.village}`}
                    {selectedAddress.district && `, Kec.${selectedAddress.district}`}
                  </p>
                  {selectedAddress.postalCode && (
                    <p className="text-xs text-gray-500 mt-1">Kode Pos: {selectedAddress.postalCode}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <div>
                  <p className="text-sm font-bold text-yellow-800">Alamat Belum Lengkap</p>
                  <p className="text-xs text-yellow-700 mt-1">Silakan lengkapi alamat Anda di halaman Profil.</p>
                </div>
              </div>
            </div>
          )}
        </section>

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

        {! isLoading && ! error && (
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
                  {/* [FIX] Tampilkan badge kategori jika ada */}
                  {effectiveCategory && (
                    <p className="text-xs text-gray-500 mt-1">
                      Kategori: <span className="font-semibold text-gray-700 capitalize">{effectiveCategory}</span>
                    </p>
                  )}
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
                    <div className="flex items-start gap-4 p-4 mb-2 bg-blue-50/50 border border-blue-100 rounded-2xl">
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
                    <p className="text-xs text-gray-500">{availableOptions.length} layanan tersedia</p>
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

                  {! isHydrated ?  (
                    <p className="text-sm text-gray-500 animate-pulse">Memuat keranjang...</p>
                  ) : activeCartItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                      </svg>
                      <p className="text-xs">Keranjang kosong</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {activeCartItems.map((item) => (
                        <div key={item.id} className="flex justify-between gap-2 text-sm group">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-gray-800 leading-tight">{item.serviceName}</p>
                            <p className="text-[10px] text-gray-500">
                              {item.orderType === 'direct' ? 'Direct' : 'Basic'}
                              {item.providerName ?  ` • ${item.providerName}` : ''}
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
            <section className="sticky bottom-4 bg-white p-4 lg:p-6 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-center sm:text-left w-full sm:w-auto">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Pembayaran</span>
                <p className="text-2xl lg:text-3xl font-black text-gray-900">{formatCurrency(currentTotalAmount)}</p>
              </div>
              <button
                onClick={handleConfirmOrder}
                disabled={isSubmitting || activeCartItems.length === 0 || ! selectedLocation || selectedLocation.coordinates[0] === 0}
                className={`w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white flex justify-center items-center gap-2 shadow-lg shadow-red-200 transition-all active:scale-95 ${
                  isSubmitting || activeCartItems.length === 0 || !selectedLocation || selectedLocation.coordinates[0] === 0
                    ? 'bg-gray-300 cursor-not-allowed shadow-none'
                    : 'bg-red-600 hover:bg-red-700 hover:-translate-y-1'
                }`}
              >
                {isSubmitting ?  (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memproses...
                  </>
                ) : (
                  <>
                    Lanjutkan Pembayaran
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </section>
          </>
        )}
      </main>

      {/* Modal Detail Layanan */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                    {selectedDetail.category}
                  </span>
                  {selectedDetail.isPromo && (
                    <span className="text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded-full">
                      PROMO
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-lg text-gray-900">{selectedDetail.name}</h3>
              </div>
              <button onClick={() => setSelectedDetail(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
              {/* Harga & Info */}
              <div className="flex items-end justify-between bg-gray-50 p-4 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Harga</p>
                  <div className="flex items-end gap-2">
                    {selectedDetail.isPromo && selectedDetail.promoPrice ?  (
                      <>
                        <span className="text-2xl font-black text-red-600">{formatCurrency(selectedDetail.promoPrice)}</span>
                        <span className="text-sm text-gray-400 line-through">{formatCurrency(selectedDetail.price)}</span>
                      </>
                    ) : (
                      <span className="text-2xl font-black text-gray-900">{formatCurrency(selectedDetail.price)}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{selectedDetail.displayUnit}</p>
                </div>
                {selectedDetail.estimatedDuration && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Estimasi</p>
                    <p className="text-sm font-bold text-gray-900">{formatDuration(selectedDetail.estimatedDuration)}</p>
                  </div>
                )}
              </div>

              {/* Deskripsi */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Deskripsi</p>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedDetail.description}</p>
              </div>

              {/* Includes */}
              {selectedDetail.includes && selectedDetail.includes.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">✓ Termasuk</p>
                  <ul className="space-y-1.5">
                    {selectedDetail.includes.map((item, idx) => (
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

              {/* Excludes */}
              {selectedDetail.excludes && selectedDetail.excludes.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">✗ Tidak Termasuk</p>
                  <ul className="space-y-1.5">
                    {selectedDetail.excludes.map((item, idx) => (
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

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => setSelectedDetail(null)}
                className="w-full py-3 bg-gray-900 text-white font-bold text-sm rounded-xl hover:bg-gray-800 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapper untuk Suspense
export default function CheckoutPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>}>
      <CheckoutContent />
    </Suspense>
  );
}