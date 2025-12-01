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

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const res = await voucherApi.getMyVouchers();
        setVouchers(res.data);
      } catch (error) {
        console.error('Failed to fetch vouchers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVouchers();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Voucher Saya</h1>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {vouchers.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Belum ada voucher</h3>
            <p className="text-gray-500 mt-1 max-w-xs">
              Saat ini kamu belum memiliki voucher diskon yang tersedia.
            </p>
          </div>
        ) : (
          vouchers.map((voucher) => (
            <div 
              key={voucher._id} 
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative"
            >
              {/* Left Decoration Stripe */}
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-purple-500"></div>
              
              {/* Card Body */}
              <div className="p-4 pl-6 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{voucher.code}</h3>
                    <p className="text-sm text-gray-600 mt-1">{voucher.description}</p>
                  </div>
                  <div className="bg-purple-50 text-purple-700 text-xs font-semibold px-2 py-1 rounded">
                    {voucher.discountType === 'percentage' 
                      ? `Diskon ${voucher.discountValue}%` 
                      : `Potongan ${formatCurrency(voucher.discountValue)}`}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {copiedCode === voucher.code ? 'Tersalin!' : 'Salin Kode'}
                  </button>
                </div>
              </div>
              
              {/* Circle Cutouts for Ticket Effect */}
              <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full"></div>
              <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full"></div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}