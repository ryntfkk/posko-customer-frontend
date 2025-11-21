// src/app/services/[category]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { fetchServices } from '@/features/services/api';
import { Service } from '@/features/services/types';
import { useCart } from '@/features/cart/useCart'; // Import Hook Keranjang

// Helper function untuk format mata uang
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// --- KOMPONEN KARTU KONFIGURASI LAYANAN (BARU) ---
interface ServiceItemCardProps {
    service: Service;
}

function ServiceItemCard({ service }: ServiceItemCardProps) {
    const { addItem } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [orderType, setOrderType] = useState<'direct' | 'basic'>('basic'); // Default Basic

    const handleAddToCart = useCallback(() => {
        if (quantity < 1) {
            alert('Kuantitas minimal 1.');
            return;
        }

        addItem({
            serviceId: service._id,
            serviceName: service.name,
            orderType: orderType,
            quantity: quantity,
            // Untuk Basic Order, harga per unit = BasePrice
            // Untuk Direct Order, harga per unit juga BasePrice (sebagai estimasi awal)
            pricePerUnit: service.basePrice, 
        });

        alert(`✅ Berhasil: ${service.name} (${quantity} unit) ditambahkan sebagai Order ${orderType.toUpperCase()}.`);
        setQuantity(1); // Reset kuantitas setelah ditambahkan
    }, [addItem, service, quantity, orderType]);

    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-lg flex flex-col lg:flex-row gap-4">
            
            {/* Bagian Kiri: Detail Layanan */}
            <div className="flex-1 space-y-2 lg:border-r lg:pr-4">
                <div className="flex items-start gap-4">
                    <div className="relative w-12 h-12 shrink-0 rounded-xl bg-red-50 p-2">
                        <Image src={service.iconUrl || '/icons/logo-posko.png'} alt={service.name} fill className="object-contain p-2"/>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{service.description || 'Deskripsi belum tersedia.'}</p>
                    </div>
                </div>
            </div>

            {/* Bagian Tengah: Kuantitas & Harga */}
            <div className="flex-1 flex flex-col justify-between pt-4 lg:pt-0 lg:px-4 lg:border-r border-gray-100">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-600">Kuantitas:</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                            className="w-8 h-8 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
                        >-</button>
                        <span className="text-lg font-black text-gray-900 w-8 text-center">{quantity}</span>
                        <button
                            onClick={() => setQuantity(q => q + 1)}
                            className="w-8 h-8 bg-red-600 rounded-lg text-white hover:bg-red-700 transition-colors"
                        >+</button>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Harga/Unit (Standar)</span>
                    <p className="text-red-600 font-bold text-xl">{formatCurrency(service.basePrice)}</p>
                </div>
            </div>

            {/* Bagian Kanan: Tipe Order & Aksi */}
            <div className="flex-1 flex flex-col justify-between pt-4 lg:pt-0 lg:pl-4">
                <div className="space-y-3">
                    <span className="text-sm font-semibold text-gray-600 block mb-2">Pilih Tipe Order:</span>
                    
                    <div 
                        onClick={() => setOrderType('basic')}
                        className={`p-3 rounded-xl cursor-pointer border-2 transition-all ${orderType === 'basic' ? 'bg-gray-50 border-gray-900' : 'bg-white border-gray-200 hover:border-gray-400'}`}
                    >
                        <h4 className="font-bold text-sm text-gray-900">Cari Cepat (Basic)</h4>
                        <p className="text-xs text-gray-500">Harga standar aplikasi ({formatCurrency(service.basePrice)})</p>
                    </div>

                    <div 
                        onClick={() => setOrderType('direct')}
                        className={`p-3 rounded-xl cursor-pointer border-2 transition-all ${orderType === 'direct' ? 'bg-red-50 border-red-600' : 'bg-white border-gray-200 hover:border-gray-400'}`}
                    >
                        <h4 className="font-bold text-sm text-gray-900">Pilih Mitra (Direct)</h4>
                        <p className="text-xs text-gray-500">Harga bervariasi (Ratecard Mitra)</p>
                    </div>
                </div>

                <button
                    onClick={handleAddToCart}
                    className="mt-6 w-full bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-transform hover:-translate-y-0.5 flex justify-center items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    Tambahkan ke Keranjang
                </button>
            </div>
        </div>
    );
}
// --- END KOMPONEN KARTU KONFIGURASI LAYANAN ---


export default function ServiceCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const { totalItems } = useCart();
  
  const categoryParam = Array.isArray(params.category) ? params.category[0] : params.category;
  const categoryName = decodeURIComponent(categoryParam || '').replace(/-/g, ' ');

  const [allServices, setAllServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchServices()
      .then(res => setAllServices(res.data || []))
      .catch(err => console.error("Gagal memuat layanan:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredServices = useMemo(() => {
    if (!categoryName) return [];
    const normalizedCategory = categoryName.toLowerCase();

    return allServices.filter(service => 
      service.category.toLowerCase() === normalizedCategory
    );
  }, [allServices, categoryName]);

  const hasServices = filteredServices.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-gray-600 hover:text-red-600">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900 capitalize">{categoryName}</h1>
          
          {/* Tombol Keranjang di Header Mobile/Desktop */}
          <Link 
            href="/checkout"
            className="ml-auto flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full hover:bg-red-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            {totalItems > 0 && <span className="font-bold text-sm">{totalItems}</span>}
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        
        {isLoading && (
            <div className="grid grid-cols-1 gap-6 animate-pulse">
                 {[1,2,3].map(i => <div key={i} className="h-40 bg-white rounded-2xl shadow-sm"></div>)}
            </div>
        )}

        {!isLoading && !hasServices && (
            <div className="text-center p-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800">Tidak Ada Layanan</h2>
                <p className="text-gray-500 mt-2">Belum ada item layanan yang terdaftar dalam kategori "{categoryName}".</p>
            </div>
        )}

        {!isLoading && hasServices && (
            <>
                <p className="text-sm text-gray-500 mb-6">Atur kuantitas dan tipe order untuk item dalam keranjang.</p>
                
                <div className="grid grid-cols-1 gap-6">
                    {filteredServices.map(service => (
                        <ServiceItemCard key={service._id} service={service} />
                    ))}
                </div>
            </>
        )}
      </main>
    </div>
  );
}