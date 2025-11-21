'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

type ProviderCard = {
  id: string;
  name: string;
  specialty: string;
  distance: string;
  rating: number;
  reviews: number;
  startingPrice: string;
  image: string;
  categoryTags: string[];
};

const providerList: ProviderCard[] = [
  {
    id: 'pwr-01',
    name: 'Raka Putra',
    specialty: 'Teknisi AC & Pendingin',
    distance: '1.2 km',
    rating: 4.9,
    reviews: 120,
    startingPrice: 'Mulai Rp 75.000',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Raka',
    categoryTags: ['ac', 'ac-service', 'pendingin'],
  },
  {
    id: 'pwr-02',
    name: 'Dewi Pertiwi',
    specialty: 'Pembersihan AC & Cuci Unit',
    distance: '0.8 km',
    rating: 5.0,
    reviews: 85,
    startingPrice: 'Mulai Rp 55.000',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dewi',
    categoryTags: ['ac', 'cuci-ac'],
  },
  {
    id: 'pwr-03',
    name: 'Budi Hartono',
    specialty: 'Perawatan Berkala & Freon',
    distance: '2.5 km',
    rating: 4.7,
    reviews: 210,
    startingPrice: 'Mulai Rp 95.000',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi',
    categoryTags: ['ac', 'freon', 'pendingin'],
  },
];

const normalize = (value: string) => value.toLowerCase().replace(/-/g, ' ').trim();

export default function ServiceCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryParam = Array.isArray(params.category) ? params.category[0] : params.category;
  const categoryName = decodeURIComponent(categoryParam || 'AC').replace(/-/g, ' ');

  const filteredProviders = useMemo(() => {
    const activeCategory = categoryParam ? normalize(categoryParam) : 'ac';

    return providerList.filter((provider) =>
      provider.categoryTags.some((tag) => normalize(tag) === activeCategory || normalize(tag).includes(activeCategory))
    );
  }, [categoryParam]);

  const handleBasicOrder = () => {
    const categoryQuery = categoryParam || 'ac';
    router.push(`/checkout?type=basic&category=${encodeURIComponent(categoryQuery)}`);
  };

  const handleOpenProvider = (providerId: string) => {
    router.push(`/provider/${providerId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-gray-600 hover:text-red-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Layanan</span>
            <h1 className="text-xl font-bold text-gray-900 capitalize">{categoryName}</h1>
          </div>
          <button
            onClick={handleBasicOrder}
            className="ml-auto px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors"
          >
            Basic Order
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-8 space-y-8">
        <section className="bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-lg shadow-red-200/60">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Pilih Mitra</p>
            <h2 className="text-2xl font-black leading-tight">Temukan teknisi AC terbaik untuk Anda</h2>
            <p className="text-white/90 text-sm max-w-2xl">
              Lihat rating, jarak, dan estimasi harga dari mitra AC terverifikasi. Pesan basic order untuk proses tercepat.
            </p>
          </div>
          <button
            onClick={handleBasicOrder}
            className="self-start lg:self-auto px-5 py-3 bg-white text-red-600 font-bold rounded-xl shadow hover:-translate-y-0.5 transition-transform"
          >
            Basic Order sekarang
          </button>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Mitra Terdekat</p>
              <h3 className="text-lg font-bold text-gray-900">{categoryName} Service Providers</h3>
            </div>
            <span className="text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-full px-3 py-1">
              {filteredProviders.length} mitra siap membantu
            </span>
          </div>

          {!filteredProviders.length && (
            <div className="text-center p-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <h4 className="text-xl font-bold text-gray-800">Belum ada mitra tersedia</h4>
              <p className="text-gray-500 mt-2">Kami belum menemukan mitra untuk kategori "{categoryName}" saat ini.</p>
            </div>
          )}

          {!!filteredProviders.length && (
            <div className="grid grid-cols-1 gap-4">
              {filteredProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleOpenProvider(provider.id)}
                  className="w-full text-left bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                      <Image src={provider.image} alt={provider.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-bold text-gray-900">{provider.name}</h4>
                        <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 rounded-full px-2 py-1">
                          {provider.distance}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{provider.specialty}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1 font-semibold text-yellow-500">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.14 3.51a1 1 0 00.95.69h3.688c.969 0 1.371 1.24.588 1.81l-2.986 2.17a1 1 0 00-.364 1.118l1.14 3.51c.3.921-.755 1.688-1.54 1.118l-2.985-2.17a1 1 0 00-1.176 0l-2.985 2.17c-.784.57-1.838-.197-1.539-1.118l1.14-3.51a1 1 0 00-.364-1.118l-2.986-2.17c-.783-.57-.38-1.81.588-1.81h3.689a1 1 0 00.95-.69l1.14-3.51z" />
                          </svg>
                          {provider.rating}
                        </span>
                        <span>{provider.reviews} ulasan</span>
                        <span className="font-bold text-gray-900">{provider.startingPrice}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-red-600">
                      Lihat profil
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );

}