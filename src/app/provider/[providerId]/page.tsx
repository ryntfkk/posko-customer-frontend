// src/app/provider/[providerId]/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Provider } from '@/features/providers/types';

// --- Tipe Data UI ---
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

// --- Data Statis (Fallback hanya jika backend mati/dev mode) ---
const staticProviderProfiles: ProviderProfile[] = [
  {
    id: 'pwr-01',
    name: 'Raka Putra',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Raka',
    specialty: 'Teknisi AC & Pendingin',
    distance: '1.2 km',
    rating: 4.9,
    reviews: 120,
    bio: 'Spesialis perawatan dan perbaikan AC dengan pengalaman lebih dari 8 tahun.',
    ratecards: [
      { id: 'rc-01', title: 'Servis Ringan', description: 'Pengecekan umum.', price: 'Rp 75.000' },
    ],
  },
];

// --- [FIX] Fetch Data Real dari API ---
async function fetchProviderFromApi(id: string): Promise<ProviderProfile | null> {
  try {
    // Pastikan URL API benar. 
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    
    console.log(`[SSR] Fetching provider: ${apiUrl}/providers/${id}`); 

    const res = await fetch(`${apiUrl}/providers/${id}`, { 
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) {
        console.error(`[SSR] Failed to fetch provider ${id}: ${res.status}`);
        return null;
    }

    const json = await res.json();
    const data: Provider = json.data; 

    if (!data) return null;

    // Mapping data dari Backend ke UI
    return {
      id: data._id,
      name: data.userId?.fullName || 'Mitra Posko',
      avatar: data.userId?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.userId?.fullName || 'User'}`,
      specialty: data.services?.[0]?.serviceId?.name || 'Layanan Profesional',
      distance: 'Menghitung...', 
      rating: data.rating || 5.0,
      reviews: Math.floor(Math.random() * 50) + 10, 
      bio: data.userId?.bio || 'Mitra terpercaya siap membantu kebutuhan rumah tangga Anda.',
      ratecards: data.services.map((svc) => ({
        id: svc._id,
        title: svc.serviceId?.name || 'Layanan',
        description: svc.serviceId?.category || 'Layanan standar',
        price: `Rp ${new Intl.NumberFormat('id-ID').format(svc.price)}`,
      })),
    };
  } catch (error) {
    console.error("[SSR] Error fetching provider detail:", error);
    return null;
  }
}

// --- Helper Pencarian ---
async function findProvider(providerId: string) {
  // 1. Coba cari di data statis (untuk testing ID pendek)
  const staticProfile = staticProviderProfiles.find((p) => p.id === providerId);
  if (staticProfile) return staticProfile;

  // 2. Jika tidak ada, ambil dari API (untuk ID MongoDB panjang)
  return await fetchProviderFromApi(providerId);
}

// --- Page Component (Server Component) ---
export default async function ProviderProfilePage({ 
  params 
}: { 
  params: Promise<{ providerId: string }> 
}) {
  // [PENTING] Await params sebelum digunakan di Next.js 15
  const { providerId } = await params;
  
  const provider = await findProvider(providerId);

  if (!provider) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-red-600 flex items-center gap-2 font-semibold transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Kembali</span>
          </Link>
          <div className="flex flex-col">
            <span className="text-[10px] lg:text-[11px] font-bold uppercase tracking-wide text-gray-400">Profil Mitra</span>
            <h1 className="text-lg lg:text-xl font-bold text-gray-900 leading-none">{provider.name}</h1>
          </div>
          <Link
            href={`/checkout?type=direct&providerId=${provider.id}`}
            className="ml-auto px-4 py-2 text-xs lg:text-sm font-bold text-white bg-red-600 rounded-full hover:bg-red-700 transition-transform hover:-translate-y-0.5 shadow-md shadow-red-100"
          >
            Pesan Jasa
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 lg:px-8 py-8 space-y-6">
        {/* Hero Profile */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -mr-10 -mt-10"></div>
          
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start relative z-10">
            <div className="relative w-28 h-28 lg:w-32 lg:h-32 rounded-full border-4 border-white shadow-lg overflow-hidden shrink-0">
              <Image src={provider.avatar} alt={provider.name} fill className="object-cover" />
            </div>
            <div className="flex-1 space-y-3 text-center md:text-left">
              <div>
                <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-1">{provider.name}</h2>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
                        {provider.specialty}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{provider.distance}</span>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm leading-relaxed max-w-2xl mx-auto md:mx-0">{provider.bio}</p>
              
              <div className="flex justify-center md:justify-start items-center gap-6 pt-2">
                <div className="text-center md:text-left">
                    <div className="flex items-center gap-1 justify-center md:justify-start">
                        <span className="text-yellow-500">★</span>
                        <span className="font-black text-gray-900">{provider.rating}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Rating</p>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="text-center md:text-left">
                    <p className="font-black text-gray-900">{provider.reviews}+</p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Ulasan</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ratecard Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 bg-red-600 rounded-full"></div>
            <h3 className="text-lg font-bold text-gray-900">Daftar Layanan & Harga</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {provider.ratecards.length === 0 ? (
                <div className="col-span-full p-6 text-center text-gray-500 bg-gray-50 rounded-xl">
                    Belum ada layanan yang diaktifkan oleh mitra ini.
                </div>
            ) : (
                provider.ratecards.map((item) => (
                <div
                    key={item.id}
                    className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-red-200 hover:shadow-lg transition-all group cursor-pointer"
                >
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <h4 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">{item.title}</h4>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-sm font-black text-gray-900">{item.price}</p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
                        <Link
                            href={`/checkout?type=direct&providerId=${provider.id}`}
                            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                            Pilih Layanan <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                        </Link>
                    </div>
                </div>
                ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}