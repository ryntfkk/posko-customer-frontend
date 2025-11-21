'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useCart } from '@/features/cart/useCart';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function OrderSummaryPage() {
  const router = useRouter();
  const { cart, totalAmount, totalItems } = useCart();

  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  const activeCartItems = useMemo(() => cart.filter((item) => item.quantity > 0), [cart]);

  const estimatedDiscount = 0;
  const payableAmount = Math.max(totalAmount - estimatedDiscount, 0);

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      setPromoMessage('Masukkan kode promo terlebih dahulu.');
      return;
    }

    setPromoMessage('Kode promo diterapkan secara otomatis jika valid.');
  };

  if (activeCartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-md text-center space-y-3 max-w-md w-full">
          <h1 className="text-xl font-bold text-gray-900">Belum ada pesanan</h1>
          <p className="text-sm text-gray-600">Tambahkan layanan di halaman checkout sebelum melihat ringkasan pesanan.</p>
          <Link
            href="/checkout"
            className="inline-flex justify-center px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700"
          >
            Kembali ke Checkout
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-red-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Ringkasan Pesanan</span>
            <h1 className="text-xl font-bold text-gray-900">Periksa detail order Anda</h1>
            <p className="text-xs text-gray-500">Pastikan informasi di bawah sudah benar sebelum melakukan pembayaran.</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 lg:px-8 py-8 space-y-6">
        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold text-gray-500">Data Pesanan</p>
              <h2 className="text-lg font-bold text-gray-900">Layanan yang dipesan</h2>
            </div>
            <Link href="/checkout" className="text-sm font-semibold text-red-600 hover:text-red-700">
              Ubah Pesanan
            </Link>
          </div>

          <div className="space-y-4">
            {activeCartItems.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 border border-gray-100 rounded-2xl p-4">
                <div className="space-y-1">
                  <p className="text-base font-bold text-gray-900 leading-tight">{item.serviceName}</p>
                  <p className="text-xs text-gray-500">
                    {item.orderType === 'direct' ? 'Direct Order' : 'Basic Order'}
                    {item.providerName ? ` • ${item.providerName}` : ''}
                  </p>
                  <p className="text-xs text-gray-500">{item.quantity} x {formatCurrency(item.pricePerUnit)}</p>
                </div>
                <p className="text-sm font-bold text-gray-900 whitespace-nowrap">{formatCurrency(item.totalPrice)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-semibold text-gray-500">Alamat Pengiriman</p>
                  <h2 className="text-lg font-bold text-gray-900">Alamat pengguna</h2>
                </div>
                <button className="text-sm font-semibold text-red-600 hover:text-red-700">Ubah</button>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-semibold">Andi Pratama</p>
                <p>Jl. Merpati Raya No. 10, Jakarta</p>
                <p>0812-3456-7890</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <p className="text-[12px] font-semibold text-gray-500">Kode Promo</p>
              <h2 className="text-lg font-bold text-gray-900">Masukkan kode promo</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Contoh: HEMAT50"
                  className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  onClick={handleApplyPromo}
                  className="px-4 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800"
                >
                  Terapkan
                </button>
              </div>
              {promoMessage && <p className="text-xs text-gray-500">{promoMessage}</p>}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold text-gray-500">Ringkasan Pembayaran</p>
                <h2 className="text-lg font-bold text-gray-900">Total Pembayaran</h2>
              </div>
              <span className="text-sm font-medium text-gray-500">{totalItems} layanan</span>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Diskon</span>
                <span className="font-semibold text-gray-900">{formatCurrency(estimatedDiscount)}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
              <span className="text-base font-bold text-gray-900">Total Bayar</span>
              <span className="text-2xl font-black text-red-600">{formatCurrency(payableAmount)}</span>
            </div>

            <button className="w-full py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700">
              Lanjutkan ke Pembayaran
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}