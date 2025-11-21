'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

type ProviderCard = {
  id: number;
  name: string;
  skill: string;
  distance: string;
  rating: number;
  image: string;
  price: string;
  reviews: number;
  categories: string[];
};

const providerList: ProviderCard[] = [
  {
    id: 1,
    name: 'Raka Putra',
    skill: 'Teknisi AC & Pendingin',
    distance: '1.2 km',
    rating: 4.9,
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Raka',
    price: 'Rp 75rb',
    reviews: 120,
    categories: ['ac', 'ac-pendingin'],
  },
  {
    id: 2,
    name: 'Dewi Pertiwi',
    skill: 'Layanan Kebersihan',
    distance: '0.8 km',
    rating: 5.0,
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dewi',
    price: 'Rp 50rb',
    reviews: 85,
    categories: ['kebersihan', 'cleaning-service'],
  },
  {
    id: 3,
    name: 'Budi Hartono',
    skill: 'Montir Motor Panggilan',
    distance: '2.5 km',
    rating: 4.7,
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi',
    price: 'Rp 100rb',
    reviews: 210,
    categories: ['montir', 'otomotif'],
  },
  {
    id: 4,
    name: 'Siti Aminah',
    skill: 'Laundry Antar Jemput',
    distance: '1.5 km',
    rating: 4.8,
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Siti',
    price: 'Rp 15rb/kg',
    reviews: 300,
    categories: ['laundry'],
  },
];

const normalize = (value: string) => value.toLowerCase().replace(/-/g, ' ').trim();

export default function ProviderCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const categoryParam = Array.isArray(params.category) ? params.category[0] : params.category;
  const categorySlug = categoryParam ? decodeURIComponent(categoryParam) : '';
  const categoryName = searchParams.get('category') || categorySlug.replace(/-/g, ' ');
  const categoryId = searchParams.get('categoryId') || categorySlug;

  const filteredProviders = useMemo(() => {
    if (!categoryId && !categoryName) return providerList;

    const normalizedFilter = normalize(categoryId || categoryName);

    return providerList.filter((provider) =>
      provider.categories.some((cat) => normalize(cat) === normalizedFilter || normalize(cat).includes(normalizedFilter))
    );
  }, [categoryId, categoryName]);

  const hasProviders = filteredProviders.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 lg:px-8 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-gray-600 hover:text-red-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Mitra Terdekat</span>
            <h1 className="text-xl font-bold text-gray-900 capitalize">{categoryName || 'Semua Kategori'}</h1>
          </div>
          {categoryId && (
            <span className="ml-auto text-[12px] font-semibold text-gray-500 bg-gray-100 rounded-full px-3 py-1">
              Filter: {categoryId}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 lg:px-8 py-8 space-y-6">
        {!hasProviders && (
          <div className="text-center p-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800">Mitra belum tersedia</h2>
            <p className="text-gray-500 mt-2">
              Kami belum menemukan mitra untuk kategori &quot;{categoryName || categoryId}&quot;. Silakan cek kembali nanti.
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href="/"
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors"
              >
                Kembali ke beranda
              </Link>
            </div>
          </div>
        )}

        {hasProviders && (
          <div className="grid grid-cols-1 gap-4">
            {filteredProviders.map((provider) => (
              <div
                key={provider.id}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                  <Image src={provider.image} alt={provider.name} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">{provider.name}</h3>
                    <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-1">
                      {provider.distance}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{provider.skill}</p>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1 font-semibold text-yellow-500">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.14 3.51a1 1 0 00.95.69h3.688c.969 0 1.371 1.24.588 1.81l-2.986 2.17a1 1 0 00-.364 1.118l1.14 3.51c.3.921-.755 1.688-1.54 1.118l-2.985-2.17a1 1 0 00-1.176 0l-2.985 2.17c-.784.57-1.838-.197-1.539-1.118l1.14-3.51a1 1 0 00-.364-1.118l-2.986-2.17c-.783-.57-.38-1.81.588-1.81h3.689a1 1 0 00.95-.69l1.14-3.51z" />
                      </svg>
                      {provider.rating}
                    </span>
                    <span>{provider.reviews} ulasan</span>
                    <span className="font-bold text-gray-900">{provider.price}</span>
                  </div>
                </div>
                <Link
                  href={`/order/choose?providerId=${provider.id}`}
                  className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
                >
                  Pilih Mitra
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}