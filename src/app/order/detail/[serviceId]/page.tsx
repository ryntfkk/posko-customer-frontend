// src/app/order/detail/[serviceId]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { fetchServices } from '@/features/services/api';
import { Service } from '@/features/services/types';
import { useCart, CartItem } from '@/features/cart/useCart';

// Helper function untuk format mata uang
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// State untuk konfigurasi item
interface OrderConfig {
    orderType: 'direct' | 'basic';
    quantity: number;
}

export default function ServiceDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { addItem, totalItems } = useCart(); // Gunakan hook cart
    
    const serviceId = Array.isArray(params.serviceId) ? params.serviceId[0] : params.serviceId;
    
    const [service, setService] = useState<Service | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [config, setConfig] = useState<OrderConfig>({
        orderType: 'basic', // Default: Basic Order (Cari Cepat)
        quantity: 1,
    });

    // 1. Ambil detail layanan spesifik
    useEffect(() => {
        if (!serviceId) return;

        fetchServices()
        .then(res => {
            const foundService = res.data.find(s => s._id === serviceId);
            setService(foundService || null);
        })
        .catch(err => console.error("Gagal memuat detail layanan:", err))
        .finally(() => setIsLoading(false));
    }, [serviceId]);

    // Harga yang ditampilkan (Untuk Basic = BasePrice. Untuk Direct, kita tampilkan BasePrice sebagai info)
    const priceDisplay = useMemo(() => {
        if (!service) return 0;
        // Kita hanya bisa menjamin harga BasePrice di halaman ini
        return service.basePrice; 
    }, [service]);

    // Tambahkan item ke keranjang
    const handleAddToCart = () => {
        if (!service || !priceDisplay || config.quantity < 1) return;

        const newItem: Omit<CartItem, 'totalPrice'|'id'> = {
            serviceId: service._id,
            serviceName: service.name,
            orderType: config.orderType,
            quantity: config.quantity,
            pricePerUnit: priceDisplay,
        };
        
        addItem(newItem);
        alert(`Berhasil menambahkan ${service.name} (${config.orderType === 'basic' ? 'Cari Cepat' : 'Pilih Mitra'}) ke keranjang!`);
        
        // Arahkan ke halaman Checkout jika ini item pertama, atau ke kategori jika sudah ada item
        if (totalItems === 0) {
             router.push('/checkout');
        } else {
             router.back();
        }
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Memuat Detail Layanan...</div>;
    if (!service) return <div className="min-h-screen text-center p-10">Layanan tidak ditemukan.</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 lg:px-8 py-4 flex items-center gap-4">
                <button onClick={() => router.back()} className="text-gray-600 hover:text-red-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <h1 className="text-xl font-bold text-gray-900">Atur Layanan</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg mb-8">
                    <div className="flex items-start gap-5 border-b border-gray-100 pb-4 mb-4">
                        <div className="relative w-16 h-16 shrink-0 rounded-xl bg-red-50 p-2">
                            <Image src={service.iconUrl || '/icons/logo-posko.png'} alt={service.name} fill className="object-contain p-2"/>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">{service.name}</h2>
                            <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Kolom Kuantitas */}
                        <div className="space-y-4 p-4 border rounded-xl">
                            <h3 className="text-lg font-bold text-gray-800">Kuantitas Layanan</h3>
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={() => setConfig(c => ({...c, quantity: Math.max(1, c.quantity - 1)}))}
                                    className="w-10 h-10 bg-gray-100 rounded-lg text-gray-700 font-bold hover:bg-gray-200 transition-colors"
                                >-</button>
                                <span className="text-2xl font-black text-gray-900 w-10 text-center">{config.quantity}</span>
                                <button
                                    onClick={() => setConfig(c => ({...c, quantity: c.quantity + 1}))}
                                    className="w-10 h-10 bg-red-600 rounded-lg text-white font-bold hover:bg-red-700 transition-colors"
                                >+</button>
                            </div>
                            <p className="text-xs text-gray-500 text-center pt-2">Total: {config.quantity} Unit/Sesi</p>
                        </div>

                        {/* Kolom Tipe Order (Radio Buttons) */}
                        <div className="space-y-4 p-4 border rounded-xl">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Pilih Tipe Order</h3>
                            
                            {/* Opsi Basic Order */}
                            <div 
                                onClick={() => setConfig(c => ({...c, orderType: 'basic'}))}
                                className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${config.orderType === 'basic' ? 'bg-gray-50 border-gray-900 shadow-md' : 'bg-white border-gray-200 hover:border-gray-400'}`}
                            >
                                <h4 className="font-bold text-gray-900 flex justify-between items-center">
                                    Cari Cepat (Basic Order)
                                </h4>
                                <p className="text-sm text-gray-500 mt-1">Harga: **{formatCurrency(service.basePrice)}**</p>
                                <p className="text-xs text-gray-400 mt-1">Sistem mencari Mitra terdekat dengan harga standar aplikasi.</p>
                            </div>

                            {/* Opsi Direct Order */}
                            <div 
                                onClick={() => setConfig(c => ({...c, orderType: 'direct'}))}
                                className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${config.orderType === 'direct' ? 'bg-red-50 border-red-600 shadow-md' : 'bg-white border-gray-200 hover:border-gray-400'}`}
                            >
                                <h4 className="font-bold text-gray-900 flex justify-between items-center">
                                    Pilih Mitra (Direct Order)
                                </h4>
                                <p className="text-sm text-red-600 mt-1">Harga: **Bervariasi**</p>
                                <p className="text-xs text-gray-400 mt-1">Anda memilih Mitra spesifik di halaman Checkout. Harga sesuai Ratecard Mitra.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ringkasan & Tombol Add to Cart */}
                <div className="sticky bottom-0 z-10 bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 flex justify-between items-center">
                    <div>
                        <span className="text-sm text-gray-500 font-medium">
                            Total Harga ({config.orderType === 'basic' ? 'Standar' : 'Estimasi'})
                        </span>
                        <p className="text-2xl font-black text-gray-900">
                           {formatCurrency(priceDisplay * config.quantity)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            *Harga ini adalah patokan, Harga final direct order akan disesuaikan.
                        </p>
                    </div>

                    <button
                        onClick={handleAddToCart}
                        className="bg-red-600 text-white font-bold px-8 py-3.5 rounded-xl shadow-xl shadow-red-200 hover:bg-red-700 transition-transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        Tambahkan ke Keranjang
                    </button>
                </div>
            </main>
        </div>
    );
}