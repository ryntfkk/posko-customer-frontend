// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  // Cek status login saat halaman dibuka
  useEffect(() => {
    const token = localStorage.getItem('posko_token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    // Hapus token dari saku celana (localStorage)
    localStorage.removeItem('posko_token');
    setIsLoggedIn(false);
    alert('Anda berhasil keluar.');
  };

  return (
    <main className="min-h-screen bg-white text-gray-800">
      {/* --- NAVIGASI ATAS (HEADER) --- */}
      <nav className="flex justify-between items-center p-6 border-b border-gray-200 shadow-sm">
        <div className="text-2xl font-bold text-blue-600">POSKO</div>
        
        <div className="flex gap-4">
          {/* Tampilkan tombol berbeda tergantung status login */}
          {isLoggedIn ? (
            <>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 text-red-500 font-medium hover:text-red-700"
              >
                Keluar
              </button>
              <div className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold">
                Akun Aktif ✅
              </div>
            </>
          ) : (
            <Link 
              href="/login" 
              className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition"
            >
              Masuk / Daftar
            </Link>
          )}
        </div>
      </nav>

      {/* --- ISI KONTEN UTAMA (HERO) --- */}
      <section className="flex flex-col items-center justify-center text-center mt-20 px-4">
        <h1 className="text-5xl font-extrabold mb-6 text-slate-900">
          Solusi Jasa <span className="text-blue-600">Cepat & Aman</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mb-10">
          Posko menghubungkan Anda dengan penyedia jasa profesional di sekitar Anda. 
          Mulai dari perbaikan rumah hingga layanan darurat.
        </p>
        
        <div className="flex gap-4">
          <button className="px-8 py-4 bg-slate-900 text-white text-lg rounded-lg font-bold hover:bg-slate-800">
            Cari Layanan
          </button>
          <button className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 text-lg rounded-lg font-bold hover:border-blue-500 hover:text-blue-500 transition">
            Jadi Mitra Provider
          </button>
        </div>
      </section>

      {/* --- FITUR UNGGULAN --- */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-24 px-4">
        <div className="p-6 border rounded-xl hover:shadow-lg transition">
          <div className="text-4xl mb-4">⚡</div>
          <h3 className="text-xl font-bold mb-2">Respons Cepat</h3>
          <p className="text-gray-500">Penyedia jasa siap datang dalam hitungan menit untuk situasi darurat.</p>
        </div>
        <div className="p-6 border rounded-xl hover:shadow-lg transition">
          <div className="text-4xl mb-4">🛡️</div>
          <h3 className="text-xl font-bold mb-2">Pembayaran Aman</h3>
          <p className="text-gray-500">Sistem Escrow memastikan uang Anda aman sampai pekerjaan selesai.</p>
        </div>
        <div className="p-6 border rounded-xl hover:shadow-lg transition">
          <div className="text-4xl mb-4">⭐</div>
          <h3 className="text-xl font-bold mb-2">Mitra Terpercaya</h3>
          <p className="text-gray-500">Semua provider melalui proses verifikasi ketat dan memiliki rating transparan.</p>
        </div>
      </section>
    </main>
  );
}