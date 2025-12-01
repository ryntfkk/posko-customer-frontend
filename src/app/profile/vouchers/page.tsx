'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { voucherApi } from '@/features/vouchers/api';
import { Voucher } from '@/features/vouchers/types';

export default function MyVouchersPage() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Tab State: 'my' (Terklaim) atau 'market' (Cari Promo)
  // Untuk simplifikasi, halaman ini fokus 'my', tapi kita kasih link ke market
  
  useEffect(() => {
    const fetchMyVouchers = async () => {
      try {
        const res = await voucherApi.getMyVouchers();
        setVouchers(res.data);
      } catch (error) {
        console.error('Failed to fetch vouchers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyVouchers();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Voucher Saya</h1>
      </div>

      {/* Tabs / Banner to Market */}
      <div className="p-4 pb-0">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 text-white flex justify-between items-center shadow-md">
              <div>
                  <h3 className="font-bold text-sm">Mau promo lebih banyak?</h3>
                  <p className="text-xs opacity-90">Klaim voucher baru di Voucher Center</p>
              </div>
              <Link href="/vouchers" className="bg-white text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors">
                  Cari Promo
              </Link>
          </div>
      </div>

      {/* Content List */}
      <div className="p-4 space-y-4">
        {vouchers.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-10 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Belum ada voucher aktif</h3>
            <p className="text-gray-500 mt-1 text-sm max-w-xs">
              Voucher yang kamu klaim akan muncul di sini. Yuk cari promo menarik!
            </p>
            <Link href="/vouchers" className="mt-4 px-6 py-2 border border-red-600 text-red-600 font-bold rounded-full text-sm hover:bg-red-50">
                Klaim Voucher Dulu
            </Link>
          </div>
        ) : (
          vouchers.map((voucher) => (
            <div 
              key={voucher.userVoucherId || voucher._id} 
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative"
            >
              {/* Left Decoration Stripe */}
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-red-500"></div>
              
              {/* Card Body */}
              <div className="p-4 pl-6 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{voucher.code}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{voucher.description}</p>
                    
                    {/* Label Spesifik Layanan */}
                    {voucher.applicableServices && voucher.applicableServices.length > 0 ? (
                         <span className="inline-block mt-1 text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
                            Khusus Layanan Tertentu
                         </span>
                    ) : (
                         <span className="inline-block mt-1 text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded border border-green-100">
                            Semua Layanan
                         </span>
                    )}

                  </div>
                  <div className="bg-red-50 text-red-700 text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
                    {voucher.discountType === 'percentage' 
                      ? `Diskon ${voucher.discountValue}%` 
                      : `Potongan ${formatCurrency(voucher.discountValue)}`}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                   <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   <span>Min. Belanja: <b>{formatCurrency(voucher.minPurchase)}</b></span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-1">
                  <div className="text-xs text-gray-400">
                    Berlaku sampai: <br/>
                    <span className="text-gray-600 font-medium">{formatDate(voucher.expiryDate)}</span>
                  </div>
                  
                  <button 
                    onClick={() => handleCopy(voucher.code)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      copiedCode === voucher.code 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-white border border-red-200 text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {copiedCode === voucher.code ? 'Tersalin!' : 'Salin'}
                  </button>
                </div>
              </div>
              
              {/* Circle Cutouts for Ticket Effect */}
              <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full border-r border-gray-100"></div>
              <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full border-l border-gray-100"></div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}