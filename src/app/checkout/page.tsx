// src/app/checkout/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { fetchServices } from '@/features/services/api';
import { Service } from '@/features/services/types';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

type CheckoutType = 'basic' | 'direct';

type NavigationState = {
  type?: CheckoutType;
  providerId?: string;
  serviceId?: string;
};

type RateCardItem = {
  serviceId: string;
  serviceName: string;
  price: number;
};

const providerNames: Record<string, string> = {
  '1': 'Raka Putra',
  '2': 'Dewi Pertiwi',
  '3': 'Budi Hartono',
  '4': 'Siti Aminah',
};

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [navigationState, setNavigationState] = useState<NavigationState>({});
  const [checkoutType, setCheckoutType] = useState<CheckoutType>('basic');
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract navigation state (e.g., when pushing with router.push(url, { state: {...} }))
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const state = (window.history.state?.state || {}) as NavigationState;
    setNavigationState(state);
  }, []);

  // Sync query params / navigation state into local state
  useEffect(() => {
    const typeParam = (searchParams.get('type') as CheckoutType | null) || navigationState.type;
    const providerParam = searchParams.get('providerId') || navigationState.providerId || null;
    const serviceParam = searchParams.get('serviceId') || navigationState.serviceId || null;

    setCheckoutType(typeParam === 'direct' ? 'direct' : 'basic');
    setSelectedProviderId(providerParam);
    setSelectedServiceId(serviceParam);
  }, [navigationState, searchParams]);

  // Fetch service catalog
  useEffect(() => {
    setIsLoading(true);
    fetchServices()
      .then((res) => setServices(res.data))
      .catch(() => setError('Gagal memuat daftar layanan. Silakan coba lagi.'))
      .finally(() => setIsLoading(false));
  }, []);

  const selectedService = useMemo(
    () => services.find((service) => service._id === selectedServiceId) || null,
    [services, selectedServiceId]
  );

  // Filter services by category for basic checkout so the user sees related services
  const relatedServices = useMemo(() => {
    if (!services.length) return [] as Service[];
    if (checkoutType === 'direct') return services;

    if (selectedService?.category) {
      return services.filter((service) => service.category === selectedService.category);
    }

    return services;
  }, [checkoutType, selectedService, services]);

  // Build ratecard for selected provider using current catalog as a baseline
  const ratecard = useMemo(() => {
    if (!selectedProviderId) return [] as RateCardItem[];

    return services.map((service, index) => {
      const multiplier = 1.05 + (index % 3) * 0.1;
      return {
        serviceId: service._id,
        serviceName: service.name,
        price: Math.round(service.basePrice * multiplier),
      };
    });
  }, [selectedProviderId, services]);

  const availableOptions: (Service | RateCardItem)[] = checkoutType === 'direct' ? ratecard : relatedServices;

  useEffect(() => {
    if (availableOptions.length === 0 || selectedServiceId) return;

    const firstOptionId = checkoutType === 'direct'
      ? (availableOptions[0] as RateCardItem).serviceId
      : (availableOptions[0] as Service)._id;

    setSelectedServiceId(firstOptionId);
  }, [availableOptions, checkoutType, selectedServiceId]);

  const pricePerUnit = useMemo(() => {
    if (!selectedServiceId) return 0;

    if (checkoutType === 'direct') {
      const rate = ratecard.find((item) => item.serviceId === selectedServiceId);
      return rate?.price ?? 0;
    }

    return selectedService?.basePrice ?? 0;
  }, [checkoutType, ratecard, selectedService?.basePrice, selectedServiceId]);

  const totalPrice = pricePerUnit * quantity;

  const providerLabel = useMemo(() => {
    if (!selectedProviderId) return 'Cari Cepat';
    return providerNames[selectedProviderId] || `Mitra #${selectedProviderId}`;
  }, [selectedProviderId]);

  const handleConfirmOrder = async () => {
    if (!selectedServiceId || pricePerUnit <= 0) {
      alert('Pilih layanan terlebih dahulu sebelum melanjutkan.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      type: checkoutType,
      providerId: selectedProviderId,
      serviceId: selectedServiceId,
      quantity,
      pricePerUnit,
      total: totalPrice,
    };

    try {
      // TODO: Ganti dengan pemanggilan API nyata
      await new Promise((resolve) => setTimeout(resolve, 700));
      console.log('Submitting order payload', payload);
      router.push(`/order/detail/${selectedServiceId}`);
    } catch (err) {
      console.error(err);
      alert('Terjadi kendala saat memproses pesanan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderServiceOption = (option: Service | RateCardItem) => {
    const isDirect = checkoutType === 'direct';
    const id = isDirect ? (option as RateCardItem).serviceId : (option as Service)._id;
    const name = isDirect ? (option as RateCardItem).serviceName : (option as Service).name;
    const category = !isDirect ? (option as Service).category : selectedService?.category;
    const description = !isDirect ? (option as Service).description : 'Harga mengikuti ratecard mitra terpilih.';
    const price = isDirect ? (option as RateCardItem).price : (option as Service).basePrice;

    return (
      <label
        key={id}
        className={`flex gap-4 p-4 border rounded-2xl cursor-pointer transition-all ${
          selectedServiceId === id
            ? 'border-red-600 bg-red-50 shadow-md'
            : 'border-gray-200 bg-white hover:border-gray-400'
        }`}
      >
        <input
          type="radio"
          name="service"
          className="mt-1 h-4 w-4 text-red-600"
          checked={selectedServiceId === id}
          onChange={() => setSelectedServiceId(id)}
        />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-gray-900">{name}</h3>
            {category && (
              <span className="text-[12px] font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                {category}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{description}</p>
          <p className="text-base font-black text-red-700">{formatCurrency(price)}</p>
        </div>
      </label>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-red-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Checkout</span>
            <h1 className="text-xl font-bold text-gray-900">{checkoutType === 'direct' ? 'Direct Order' : 'Basic Order'}</h1>
            <p className="text-xs text-gray-500">{checkoutType === 'direct' ? providerLabel : 'Cari Mitra otomatis dengan harga standar'}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 lg:px-8 py-8 space-y-6">
        {isLoading && <div className="text-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">Memuat opsi layanan...</div>}
        {error && <div className="text-center p-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl">{error}</div>}

        {!isLoading && !error && (
          <>
            <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-semibold text-gray-500">Tipe Order</p>
                  <p className="text-lg font-bold text-gray-900">{checkoutType === 'direct' ? 'Pilih Mitra' : 'Cari Cepat'}</p>
                  {checkoutType === 'direct' && (
                    <p className="text-xs text-gray-500">Ratecard {providerLabel} digunakan sebagai dasar perhitungan.</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    className={`px-3 py-2 text-sm font-bold rounded-xl border ${
                      checkoutType === 'basic'
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                    }`}
                    onClick={() => setCheckoutType('basic')}
                  >
                    Basic
                  </button>
                  <button
                    className={`px-3 py-2 text-sm font-bold rounded-xl border ${
                      checkoutType === 'direct'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                    }`}
                    onClick={() => setCheckoutType('direct')}
                  >
                    Direct
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="md:col-span-2 space-y-3">
                  <p className="text-sm font-semibold text-gray-700">Pilih layanan</p>
                  {availableOptions.length === 0 && (
                    <p className="text-sm text-gray-500">Belum ada layanan yang tersedia.</p>
                  )}
                  <div className="space-y-3">
                    {availableOptions.map((option) => renderServiceOption(option))}
                  </div>
                </div>

                <div className="p-4 border rounded-2xl bg-gray-50 space-y-4">
                  <p className="text-sm font-semibold text-gray-700">Jumlah</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      className="w-10 h-10 rounded-lg bg-white border border-gray-200 hover:border-gray-400"
                    >
                      -
                    </button>
                    <span className="text-2xl font-black text-gray-900 w-12 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity((prev) => prev + 1)}
                      className="w-10 h-10 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Jumlah unit/sesi yang akan dipesan.</p>
                </div>
              </div>
            </section>

            <section className="sticky bottom-0 bg-white p-6 rounded-2xl shadow-2xl border border-red-600/50 flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-500 font-medium">Estimasi Tagihan</span>
                <p className="text-3xl font-black text-red-600">{formatCurrency(totalPrice)}</p>
                <p className="text-xs text-gray-500">Harga per unit: {formatCurrency(pricePerUnit)}</p>
              </div>
              <button
                onClick={handleConfirmOrder}
                disabled={isSubmitting || !selectedServiceId || pricePerUnit <= 0}
                className={`px-6 py-4 rounded-xl font-bold text-white flex items-center gap-2 shadow-xl shadow-red-200 transition-transform ${
                  isSubmitting || !selectedServiceId || pricePerUnit <= 0
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 hover:-translate-y-0.5'
                }`}
              >
                {isSubmitting ? 'Memproses...' : 'Konfirmasi Pesanan'}
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}