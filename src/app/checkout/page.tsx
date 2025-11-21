// src/app/checkout/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useCart } from '@/features/cart/useCart';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function CheckoutPage() {
    const router = useRouter();
    const { cart, totalAmount, totalItems, removeItem, clearCart, isHydrated } = useCart();
    
    if (!isHydrated) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Memuat Keranjang...</div>;
    
    // Check jika ada item Direct Order yang belum memiliki provider
    const needsProviderSelection = cart.some(item => item.orderType === 'direct' && !item.providerId);

    const handleFinalCheckout = () => {
        if (needsProviderSelection) {
            alert("Harap pilih Mitra untuk semua item Direct Order sebelum melanjutkan.");
            // Nanti redirect ke halaman pemilihan provider
            return;
        }

        // Logic API Submission (nanti di update selanjutnya)
        alert(`Memproses ${totalItems} unit layanan dengan total: ${formatCurrency(totalAmount)}. Submission ke Backend sedang disiapkan.`);
        
        // Simulasikan success
        clearCart();
        router.push('/orders'); 
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10 font-sans">
            <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 lg:px-8 py-4 flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-gray-600 hover:text-red-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Keranjang ({totalItems} Unit)</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
                {cart.length === 0 ? (
                    <div className="text-center p-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800">Keranjang Kosong</h2>
                        <p className="text-gray-500 mt-2">Tambahkan layanan dari halaman kategori.</p>
                        <button 
                            onClick={() => router.push('/')} 
                            className="mt-6 bg-red-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-red-700 transition-all"
                        >
                            Mulai Belanja
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {needsProviderSelection && (
                            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 text-sm rounded-r-lg font-medium">
                                ⚠️ Anda memiliki item **Direct Order**. Harap pilih mitra yang Anda inginkan (Fitur pemilihan mitra akan ditambahkan di langkah selanjutnya).
                            </div>
                        )}
                        {cart.map(item => (
                            <div key={item.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                                <div className="flex-1 min-w-0">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.orderType === 'direct' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                        {item.orderType === 'direct' ? 'PILIH MITRA' : 'CARI CEPAT'}
                                    </span>
                                    <h3 className="text-lg font-bold text-gray-900 mt-1 truncate">{item.serviceName}</h3>
                                    <p className="text-sm text-gray-500">
                                        {item.quantity} Unit x {formatCurrency(item.pricePerUnit)}
                                        {item.providerName && <span className="ml-2 text-green-600 font-medium"> (Mitra: {item.providerName})</span>}
                                    </p>
                                </div>
                                <div className="text-right shrink-0 ml-4">
                                    <p className="text-xl font-black text-gray-900">{formatCurrency(item.totalPrice)}</p>
                                    <button onClick={() => removeItem(item.id)} className="text-red-500 text-xs mt-1 hover:underline">Hapus</button>
                                </div>
                            </div>
                        ))}
                        
                        {/* Summary dan Tombol Checkout */}
                        <div className="sticky bottom-0 bg-white p-6 rounded-2xl shadow-2xl border-2 border-red-600/50 flex justify-between items-center">
                            <div>
                                <span className="text-sm text-gray-500 font-medium">Total Harga</span>
                                <p className="text-3xl font-black text-red-600">{formatCurrency(totalAmount)}</p>
                            </div>
                            <button
                                onClick={handleFinalCheckout}
                                className="bg-red-600 text-white font-bold px-8 py-4 rounded-xl shadow-xl shadow-red-200 hover:bg-red-700 transition-transform flex items-center gap-2"
                            >
                                Proses Pesanan
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}