// src/app/vouchers/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { voucherApi } from '@/features/vouchers/api';
import { Voucher } from '@/features/vouchers/types';
import Image from 'next/image';

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
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Header dengan Gradient */}
      <div className="bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg sticky top-0 z-20">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 -ml-2 text-white/90 hover:bg-white/20 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            </button>
            <div>
                <h1 className="text-xl font-bold leading-none">Voucher Center</h1>
                <p className="text-xs text-red-100 mt-1">Klaim promo spesial untuk hemat lebih banyak!</p>
            </div>
          </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        {/* Banner Info */}
        <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="relative z-10 flex items-center justify-between">
                <div>
                    <h2 className="font-bold text-lg mb-1">Punya Kode Voucher?</h2>
                    <p className="text-sm opacity-90 max-w-xs">Gunakan kode voucher saat checkout untuk mendapatkan potongan harga langsung.</p>
                </div>
                <div className="text-4xl animate-bounce">🎟️</div>
            </div>
        </div>

        {vouchers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"/></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Belum Ada Voucher</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-xs">Sepertinya kamu sudah mengklaim semua voucher atau belum ada promo baru.</p>
            <button onClick={() => router.push('/profile/vouchers')} className="mt-6 text-red-600 font-bold text-sm bg-red-50 px-6 py-2.5 rounded-full hover:bg-red-100 transition-colors">
                Lihat Voucher Saya
            </button>
          </div>
        ) : (
          <div className="space-y-4">
             {vouchers.map((voucher) => (
                <div key={voucher._id} className="group relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-100 flex flex-col sm:flex-row">
                    
                    {/* Left Side: Visual & Value */}
                    <div className="bg-gray-50 p-5 flex flex-col justify-center items-center sm:w-32 border-b sm:border-b-0 sm:border-r border-dashed border-gray-200 relative">
                        {/* Cutout circles for ticket effect */}
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full sm:hidden"></div>
                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full sm:hidden"></div>
                        
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
                             {voucher.discountType === 'percentage' ? (
                                 <span className="font-black text-lg">%</span>
                             ) : (
                                 <span className="font-black text-lg">Rp</span>
                             )}
                        </div>
                        <div className="text-center">
                            <span className="block font-black text-gray-900 text-lg">
                                {voucher.discountType === 'percentage' ? `${voucher.discountValue}%` : 'Potongan'}
                            </span>
                            {voucher.discountType === 'fixed' && (
                                <span className="block font-bold text-gray-700 text-xs">
                                    {formatCurrency(voucher.discountValue)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Details */}
                    <div className="flex-1 p-5 flex flex-col justify-between relative">
                         {/* Decoration Circles (Ticket) */}
                         <div className="absolute -top-2 right-16 w-4 h-4 bg-gray-50 rounded-full border border-gray-100 hidden sm:block"></div>
                         <div className="absolute -bottom-2 right-16 w-4 h-4 bg-gray-50 rounded-full border border-gray-100 hidden sm:block"></div>

                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded border border-red-100">
                                    {voucher.code}
                                </span>
                                {voucher.applicableServices && voucher.applicableServices.length > 0 && (
                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded border border-blue-100">
                                        Khusus
                                    </span>
                                )}
                            </div>
                            <h3 className="font-bold text-gray-900 text-base leading-tight">{voucher.description}</h3>
                        </div>
                        
                        <div className="flex items-end justify-between gap-4">
                            <div className="text-xs text-gray-500 space-y-1">
                                <p className="flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                    Min. Belanja {formatCurrency(voucher.minPurchase)}
                                </p>
                                <p className="flex items-center gap-1.5 text-red-500">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                    Berlaku s/d {formatDate(voucher.expiryDate)}
                                </p>
                            </div>

                            <button 
                                onClick={() => handleClaim(voucher.code, voucher._id)}
                                disabled={claimingId === voucher._id}
                                className="shrink-0 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-red-200 active:scale-95 flex items-center gap-2"
                            >
                                {claimingId === voucher._id ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        <span>Proses...</span>
                                    </>
                                ) : 'Klaim'}
                            </button>
                        </div>
                    </div>
                </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}