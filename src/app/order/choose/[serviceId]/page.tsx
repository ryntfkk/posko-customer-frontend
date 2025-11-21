// src/app/order/choose/[serviceId]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { fetchServices } from '@/features/services/api';
import { Service } from '@/features/services/types';

// Helper function untuk format mata uang
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function OrderChoosePage() {
  const router = useRouter();
  const params = useParams();
  
  const serviceId = Array.isArray(params.serviceId) ? params.serviceId[0] : params.serviceId;
  
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Ambil detail layanan spesifik
  useEffect(() => {
    if (!serviceId) return;

    fetchServices()
      .then(res => {
        // Cari layanan berdasarkan ID
        const foundService = res.data.find(s => s._id === serviceId);
        setService(foundService || null);
      })
      .catch(err => {
        console.error("Gagal memuat detail layanan:", err);
        setService(null);
      })
      .finally(() => setIsLoading(false));
  }, [serviceId]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Memuat Opsi Pemesanan...</div>;
  if (!service) return <div className="min-h-screen text-center p-10">Layanan tidak ditemukan.</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-red-600">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Pilih Tipe Pemesanan</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
        {/* Ringkasan Layanan yang Dipilih */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg mb-8 flex items-center gap-5">
            <div className="relative w-16 h-16 shrink-0 rounded-xl bg-red-50 p-2">
                <Image src={service.iconUrl || '/icons/logo-posko.png'} alt={service.name} fill className="object-contain p-2"/>
            </div>
            <div>
                <h2 className="text-2xl font-black text-gray-900">{service.name}</h2>
                <p className="text-sm text-gray-500">{service.description.split('.')[0]}</p>
            </div>
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-4">Bagaimana Anda ingin memesan?</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* OPSI 1: DIRECT ORDER (Pilih Mitra Sendiri) */}
            <div className="bg-white p-6 rounded-2xl border-2 border-red-200 shadow-xl flex flex-col justify-between hover:scale-[1.01] transition-transform">
                <div className="space-y-3">
                    <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold inline-block">Rekomendasi</span>
                    <h4 className="text-xl font-bold text-gray-900">Direct Order</h4>
                    <p className="text-sm text-gray-600">Pilih Mitra spesifik (berdasarkan rating/jarak) dan lihat Ratecard harga mereka masing-masing.</p>
                    
                    <div className="mt-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 15.75V15h2v2.75h-2zm0-4.75V7h2v6h-2z" /></svg>
                        <span className="text-xs text-gray-500 font-medium">Anda menentukan harga dan kualitas.</span>
                    </div>
                </div>

                <Link 
                    href={`/order/direct/${service._id}`} 
                    className="mt-6 w-full text-center bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                >
                    Lanjut Pilih Mitra
                </Link>
            </div>

            {/* OPSI 2: BASIC ORDER (Cari Cepat) */}
            <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-md flex flex-col justify-between hover:scale-[1.01] transition-transform">
                <div className="space-y-3">
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold inline-block">Paling Cepat</span>
                    <h4 className="text-xl font-bold text-gray-900">Basic Order</h4>
                    <p className="text-sm text-gray-600">Sistem akan mencarikan Mitra terdekat dengan harga standar ({formatCurrency(service.basePrice)}) yang paling cepat merespon.</p>
                    
                    <div className="mt-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 15.75V15h2v2.75h-2zm0-4.75V7h2v6h-2z" /></svg>
                        <span className="text-xs text-gray-500 font-medium">Harga tetap, kecepatan prioritas.</span>
                    </div>
                </div>

                <Link 
                    href={`/order/basic/${service._id}`}
                    className="mt-6 w-full text-center bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors shadow-lg shadow-gray-200"
                >
                    Cari Cepat ({formatCurrency(service.basePrice)})
                </Link>
            </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">Dengan menekan tombol di atas, Anda menyetujui Syarat dan Ketentuan Posko Service.</p>
      </main>
    </div>
  );
}