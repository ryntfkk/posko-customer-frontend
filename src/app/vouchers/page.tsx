'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { voucherApi } from '@/features/vouchers/api';
import { Voucher } from '@/features/vouchers/types';

export default function VoucherMarketplacePage() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Load Voucher Marketplace
  useEffect(() => {
    const fetchAvailable = async () => {
      try {
        const res = await voucherApi.getAvailableVouchers();
        setVouchers(res.data);
      } catch (error) {
        console.error('Failed to fetch marketplace:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailable();
  }, []);

  const handleClaim = async (code: string, id: string) => {
    setClaimingId(id);
    try {
        await voucherApi.claimVoucher(code);
        alert(`Berhasil klaim voucher ${code}!`);
        // Hapus dari list setelah diklaim
        setVouchers(prev => prev.filter(v => v._id !== id));
    } catch (error: any) {
        console.error("Gagal klaim:", error);
        alert(error.response?.data?.message || "Gagal mengklaim voucher.");
    } finally {
        setClaimingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
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
        <h1 className="text-lg font-bold text-gray-900">Voucher Center</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Intro */}
        <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg mb-6">
            <h2 className="font-bold text-lg mb-1">Cari Promo Hemat?</h2>
            <p className="text-sm opacity-90">Klaim voucher di bawah ini dan gunakan saat checkout.</p>
        </div>

        {vouchers.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 font-medium">Yah, semua voucher sudah kamu klaim atau sedang habis.</p>
            <button onClick={() => router.push('/profile/vouchers')} className="mt-4 text-red-600 font-bold hover:underline">
                Lihat Voucher Saya
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
             {vouchers.map((voucher) => (
                <div key={voucher._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                             <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {voucher.code}
                             </span>
                             {voucher.applicableServices && voucher.applicableServices.length > 0 && (
                                <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
                                    Spesifik
                                </span>
                             )}
                        </div>
                        <h3 className="font-bold text-gray-900 truncate">{voucher.description}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Diskon {voucher.discountType === 'percentage' ? `${voucher.discountValue}%` : formatCurrency(voucher.discountValue)} • Min. {formatCurrency(voucher.minPurchase)}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                            Exp: {formatDate(voucher.expiryDate)}
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => handleClaim(voucher.code, voucher._id)}
                        disabled={claimingId === voucher._id}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-sm font-bold px-5 py-2 rounded-lg transition-all shadow-red-200 shadow-md flex items-center gap-2"
                    >
                        {claimingId === voucher._id ? (
                            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : 'Klaim'}
                    </button>
                </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}