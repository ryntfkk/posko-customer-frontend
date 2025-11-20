// src/app/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const services = [
  { title: 'Perbaikan AC', description: 'Teknisi bersertifikat siap memperbaiki AC Anda.' },
  { title: 'Instalasi Listrik', description: 'Pengecekan instalasi hingga pemasangan panel baru.' },
  { title: 'Servis Motor', description: 'Perawatan rutin dan perbaikan ringan untuk motor Anda.' },
  { title: 'Bersih Rumah', description: 'Tim kebersihan profesional untuk rumah dan kantor.' },
  { title: 'Perbaikan Pipa', description: 'Tukang pipa berpengalaman untuk masalah bocor atau mampet.' },
  { title: 'IT Support', description: 'Bantuan teknis untuk laptop, jaringan, dan server.' },
];

const technicians = [
  {
    name: 'Raka Putra',
    skill: 'Teknisi AC & Pendingin',
    distance: '1.2 km',
    rating: 4.9,
    orders: 210,
  },
  {
    name: 'Dewi Pertiwi',
    skill: 'Instalasi Listrik',
    distance: '2.0 km',
    rating: 4.8,
    orders: 180,
  },
  {
    name: 'Budi Hartono',
    skill: 'Servis Motor',
    distance: '3.1 km',
    rating: 4.7,
    orders: 145,
  },
  {
    name: 'Nina Rahma',
    skill: 'Pembersihan Rumah',
    distance: '0.9 km',
    rating: 5,
    orders: 260,
  },
  {
    name: 'Andi Wijaya',
    skill: 'IT Support',
    distance: '4.3 km',
    rating: 4.6,
    orders: 120,
  },
];

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(() =>
    typeof window !== 'undefined' ? Boolean(localStorage.getItem('posko_token')) : false,
  );
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateDevice = () => setIsMobile(window.innerWidth < 1024);
    updateDevice();
    window.addEventListener('resize', updateDevice);
    return () => window.removeEventListener('resize', updateDevice);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('posko_token');
    setIsLoggedIn(false);
    alert('Anda berhasil keluar.');
    router.refresh();
  };

  const highlightedServices = useMemo(() => services.slice(0, 4), []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 text-gray-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#fca5a5,transparent_30%)] opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,#fecdd3,transparent_30%)] opacity-60" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-red-100 bg-white/80 backdrop-blur">
        <nav
          className={`mx-auto flex max-w-6xl items-center justify-between px-4 py-4 ${
            isMobile ? 'gap-3' : 'gap-6'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600 text-lg font-extrabold text-white">
              P
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-red-500">Posko Services</p>
              <p className="text-lg font-bold text-gray-900">Marketplace Jasa Terdekat</p>
            </div>
          </div>

          {!isMobile && (
            <div className="flex items-center gap-3 rounded-full border border-red-100 bg-white px-4 py-2 shadow-sm">
              <input
                type="text"
                placeholder="Cari layanan atau teknisi..."
                className="w-72 border-none text-sm focus:outline-none"
              />
              <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-semibold text-white">Cari</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <div className="hidden items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700 shadow-sm sm:flex">
                  Akun Aktif ✅
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Keluar
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-red-700"
              >
                Masuk / Daftar
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto mt-4 grid max-w-6xl grid-cols-1 gap-10 px-4 py-8 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="flex flex-col gap-6 rounded-3xl bg-white/80 p-6 shadow-xl ring-1 ring-red-100 lg:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">
            🔍 Pilih jasa, kami cari teknisinya
          </div>
          <h1 className="text-3xl font-black leading-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Temukan penyedia jasa terbaik di sekitar Anda dengan pengalaman layaknya marketplace modern.
          </h1>
          <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
            Posko menghubungkan Anda dengan mitra profesional yang sudah diverifikasi. Pilih layanan, bandingkan
            rating, dan pesan langsung dengan perlindungan transaksi aman.
          </p>

          {isMobile && (
            <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-white px-4 py-3 shadow-sm">
              <input
                type="text"
                placeholder="Cari layanan atau teknisi..."
                className="w-full border-none text-sm focus:outline-none"
              />
              <span className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white">Cari</span>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button className="rounded-2xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-red-700">
              Mulai Cari Jasa
            </button>
            <button className="rounded-2xl border border-red-200 px-6 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50">
              Jadi Mitra Provider
            </button>
            <button className="rounded-2xl border border-dashed border-red-200 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-red-400 hover:text-red-700">
              Lihat Promo & Bundling
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-red-700">12K+</p>
              <p className="text-xs text-red-500">Pesanan selesai</p>
            </div>
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-red-700">4.8/5</p>
              <p className="text-xs text-red-500">Rata-rata rating</p>
            </div>
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-red-700">+500</p>
              <p className="text-xs text-red-500">Teknisi aktif</p>
            </div>
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-red-700">12/7</p>
              <p className="text-xs text-red-500">Dukungan live chat</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-6 -top-6 h-28 w-28 rounded-full bg-red-100 opacity-60 blur-3xl" />
          <div className="absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-red-200 opacity-50 blur-3xl" />
          <div className="relative h-full rounded-3xl bg-gradient-to-br from-red-600 via-red-500 to-red-700 p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-red-100">Layanan Trending</p>
                <p className="text-2xl font-bold">Pilihan Favorit Minggu Ini</p>
              </div>
              <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">Realtime</div>
            </div>

            <div className="mt-6 space-y-4">
              {highlightedServices.map((service) => (
                <div
                  key={service.title}
                  className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 backdrop-blur hover:bg-white/20"
                >
                  <div>
                    <p className="text-base font-semibold">{service.title}</p>
                    <p className="text-xs text-red-100">{service.description}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-red-600">Pesan</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between rounded-2xl bg-white/10 p-4">
              <div>
                <p className="text-sm text-red-100">Butuh bantuan cepat?</p>
                <p className="text-lg font-bold">Hubungi teknisi terdekat dalam hitungan menit.</p>
              </div>
              <button className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-md">
                Chat Sekarang
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Kategori Layanan */}
      <section className="relative z-10 mx-auto mt-8 max-w-6xl px-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">Kategori unggulan</p>
            <h2 className="text-2xl font-bold text-gray-900">Semua jenis layanan siap dipesan</h2>
          </div>
          {!isMobile && (
            <button className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
              Lihat semua
            </button>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="group rounded-2xl border border-red-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-lg">🔧</div>
              <h3 className="mt-4 text-sm font-semibold text-gray-900">{service.title}</h3>
              <p className="mt-2 text-xs text-gray-500 max-h-10 overflow-hidden text-ellipsis">{service.description}</p>
              <button className="mt-3 text-xs font-semibold text-red-600 underline-offset-4 group-hover:underline">
                Pesan sekarang
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Teknisi Terdekat */}
      <section className="relative z-10 mx-auto mt-12 max-w-6xl px-4 pb-28 lg:pb-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">Teknisi terdekat</p>
            <h2 className="text-2xl font-bold text-gray-900">Geser untuk lihat mitra populer</h2>
          </div>
          <div className="hidden items-center gap-2 text-sm font-semibold text-red-600 lg:flex">
            Geser kanan/kiri
            <span className="rounded-full bg-red-100 px-3 py-1">⇆</span>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-red-100 bg-white/80 p-4 shadow-lg">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {technicians.map((tech) => (
              <div
                key={tech.name}
                className="min-w-[230px] rounded-2xl border border-red-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-sm font-bold text-red-700">
                    {tech.name.slice(0, 2)}
                  </div>
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">{tech.distance}</span>
                </div>
                <h3 className="mt-4 text-base font-bold text-gray-900">{tech.name}</h3>
                <p className="text-sm text-gray-500">{tech.skill}</p>

                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-red-600">
                  <div className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1">⭐ {tech.rating}</div>
                  <div className="text-gray-500">{tech.orders} pesanan</div>
                </div>

                <button className="mt-4 w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700">
                  Chat teknisi
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Navbar for Mobile */}
      {isMobile && (
        <nav className="fixed bottom-4 left-1/2 z-20 flex w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 items-center justify-around rounded-2xl border border-red-100 bg-white/90 p-3 shadow-2xl backdrop-blur lg:hidden">
          {[
            { label: 'Home', icon: '🏠' },
            { label: 'My Order', icon: '📦' },
            { label: 'Chat', icon: '💬' },
            { label: 'Profile', icon: '👤' },
          ].map((item) => (
            <button
              key={item.label}
              className="flex flex-col items-center gap-1 text-xs font-semibold text-gray-700"
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </main>
  );

}