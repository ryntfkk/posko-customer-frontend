import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type RateCard = {
  id: string;
  title: string;
  description: string;
  price: string;
};

type ProviderProfile = {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  distance: string;
  rating: number;
  reviews: number;
  bio: string;
  ratecards: RateCard[];
};

const providerProfiles: ProviderProfile[] = [
  {
    id: 'pwr-01',
    name: 'Raka Putra',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Raka',
    specialty: 'Teknisi AC & Pendingin',
    distance: '1.2 km',
    rating: 4.9,
    reviews: 120,
    bio: 'Spesialis perawatan dan perbaikan AC dengan pengalaman lebih dari 8 tahun. Berkomitmen pada kecepatan respon dan hasil rapih.',
    ratecards: [
      {
        id: 'rc-01',
        title: 'Servis Ringan',
        description: 'Pengecekan umum, pembersihan filter, dan uji fungsi dasar unit AC.',
        price: 'Rp 75.000',
      },
      {
        id: 'rc-02',
        title: 'Cuci AC Lengkap',
        description: 'Pembersihan evaporator, blower, dan kondensor untuk performa maksimal.',
        price: 'Rp 120.000',
      },
      {
        id: 'rc-03',
        title: 'Pengisian Freon',
        description: 'Isi ulang freon R32/R410A beserta pemeriksaan kebocoran.',
        price: 'Mulai Rp 250.000',
      },
    ],
  },
  {
    id: 'pwr-02',
    name: 'Dewi Pertiwi',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dewi',
    specialty: 'Pembersihan AC & Cuci Unit',
    distance: '0.8 km',
    rating: 5.0,
    reviews: 85,
    bio: 'Teknisi pembersihan AC yang teliti dan ramah. Mengutamakan kebersihan area kerja dan edukasi perawatan ke pelanggan.',
    ratecards: [
      {
        id: 'rc-04',
        title: 'Cuci AC Standard',
        description: 'Cuci indoor + outdoor, pengecekan aliran udara, dan deodorizing.',
        price: 'Rp 90.000',
      },
      {
        id: 'rc-05',
        title: 'Deep Cleaning',
        description: 'Pembongkaran dan pembersihan mendalam untuk AC yang jarang dirawat.',
        price: 'Rp 160.000',
      },
    ],
  },
  {
    id: 'pwr-03',
    name: 'Budi Hartono',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi',
    specialty: 'Perawatan Berkala & Freon',
    distance: '2.5 km',
    rating: 4.7,
    reviews: 210,
    bio: 'Berpengalaman menangani berbagai merek AC rumah tangga dan komersial. Siap membantu konsultasi dan jadwal perawatan rutin.',
    ratecards: [
      {
        id: 'rc-06',
        title: 'Maintenance Rutin',
        description: 'Cek tekanan freon, arus listrik, dan kalibrasi suhu berkala.',
        price: 'Rp 95.000',
      },
      {
        id: 'rc-07',
        title: 'Service + Freon',
        description: 'Paket perawatan dan isi ulang freon untuk peningkatan performa.',
        price: 'Rp 280.000',
      },
    ],
  },
];

function findProvider(providerId: string) {
  return providerProfiles.find((provider) => provider.id === providerId);
}

export default function ProviderProfilePage({ params }: { params: { providerId: string } }) {
  const provider = findProvider(params.providerId);

  if (!provider) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/services/ac" className="text-gray-600 hover:text-red-600 flex items-center gap-2 font-semibold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
          </Link>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Profil Mitra</span>
            <h1 className="text-xl font-bold text-gray-900">{provider.name}</h1>
          </div>
          <Link
            href={`/checkout?type=direct&providerId=${provider.id}`}
            className="ml-auto px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors"
          >
            Direct Order
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 lg:px-8 py-8 space-y-6">
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
              <Image src={provider.avatar} alt={provider.name} fill className="object-cover" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-black text-gray-900">{provider.name}</h2>
                <span className="text-xs font-semibold text-gray-600 bg-gray-100 rounded-full px-2 py-1">{provider.distance}</span>
              </div>
              <p className="text-sm text-gray-500">{provider.specialty}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1 font-semibold text-yellow-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.14 3.51a1 1 0 00.95.69h3.688c.969 0 1.371 1.24.588 1.81l-2.986 2.17a1 1 0 00-.364 1.118l1.14 3.51c.3.921-.755 1.688-1.54 1.118l-2.985-2.17a1 1 0 00-1.176 0l-2.985 2.17c-.784.57-1.838-.197-1.539-1.118l1.14-3.51a1 1 0 00-.364-1.118l-2.986-2.17c-.783-.57-.38-1.81.588-1.81h3.689a1 1 0 00.95-.69l1.14-3.51z" />
                  </svg>
                  {provider.rating}
                </span>
                <span>{provider.reviews} ulasan</span>
              </div>
              <p className="text-gray-700 leading-relaxed">{provider.bio}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/checkout?type=direct&providerId=${provider.id}`}
              className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
            >
              Direct Order
            </Link>
            <Link href="/services/ac" className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100">
              Lihat mitra lain
            </Link>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ratecard</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <div className="grid grid-cols-1 gap-4">
            {provider.ratecards.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900">{item.price}</span>
                  <Link
                    href={`/checkout?type=direct&providerId=${provider.id}`}
                    className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors"
                  >
                    Pilih
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}