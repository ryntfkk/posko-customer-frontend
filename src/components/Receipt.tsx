// src/components/Receipt.tsx
'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { Order } from '@/features/orders/types';

interface ReceiptProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

// --- HELPERS (Disalin agar komponen mandiri) ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function Receipt({ order, isOpen, onClose }: ReceiptProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  // Kalkulasi data untuk ditampilkan
  const providerName = typeof order.providerId === 'object' && order.providerId 
    ? order.providerId.userId.fullName 
    : 'Menunggu Mitra';

  const customerName = order.customerContact?.name || 
    (typeof order.userId === 'object' ? order.userId.fullName : 'Customer');
    
  const customerPhone = order.customerContact?.phone || 
    (typeof order.userId === 'object' ? order.userId.phoneNumber : '-');

  const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  const totalAdditionalFees = order.additionalFees?.reduce((acc, fee) => {
    if (fee.status === 'rejected') return acc;
    return acc + fee.amount;
  }, 0) || 0;

  const grandTotal = order.totalAmount + totalAdditionalFees;

  // [UPDATED] Logika penentuan status LUNAS
  // Status selain pending, cancelled, failed berarti uang sudah masuk (minimal pembayaran awal)
  const isPaid = !['pending', 'cancelled', 'failed'].includes(order.status);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static">
      
      {/* Container Nota */}
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:max-h-none print:w-full print:max-w-none">
        
        {/* Header Modal (Tombol Aksi) - Disembunyikan saat Print */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 print:hidden">
          <h3 className="font-bold text-gray-700">Pratinjau Kuitansi</h3>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint} 
              className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              Cetak / Simpan PDF
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* Area yang akan di-Print */}
        <div ref={printAreaRef} className="p-8 overflow-y-auto print:overflow-visible print:p-0" id="receipt-content">
          {/* CSS Khusus Print untuk menyembunyikan elemen lain di body */}
          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #receipt-content, #receipt-content * {
                visibility: visible;
              }
              #receipt-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 20px;
              }
            }
          `}</style>

          {/* Header Nota */}
          <div className="flex justify-between items-start mb-8 border-b border-gray-200 pb-6">
            <div className="flex items-center gap-3">
               {/* Ganti src logo sesuai kebutuhan, ini placeholder */}
               <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                 P
               </div>
               <div>
                 <h1 className="text-2xl font-bold text-gray-900">POSKO</h1>
                 <p className="text-sm text-gray-500">Jasa Layanan Profesional</p>
               </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">KUITANSI</h2>
              <p className="text-sm text-gray-500 mt-1">#{order.orderNumber}</p>
              
              <div className={`mt-2 inline-block px-3 py-1 border-2 text-sm font-bold uppercase tracking-wider transform -rotate-2 rounded
                ${isPaid ? 'border-green-600 text-green-600' : 'border-gray-300 text-gray-400'}`
              }>
                {isPaid ? 'LUNAS' : 'BELUM LUNAS'}
              </div>
            </div>
          </div>

          {/* Info Order */}
          <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
            <div>
              <p className="font-bold text-gray-400 text-xs uppercase mb-1">Diterbitkan Untuk:</p>
              <p className="font-bold text-gray-900 text-lg">{customerName}</p>
              <p className="text-gray-600">{customerPhone}</p>
              {order.shippingAddress && (
                <p className="text-gray-600 mt-1 max-w-[250px]">
                  {order.shippingAddress.detail}, {order.shippingAddress.village}, {order.shippingAddress.district}, {order.shippingAddress.city}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="mb-2">
                <p className="font-bold text-gray-400 text-xs uppercase">Tanggal Pesanan:</p>
                <p className="font-medium text-gray-900">{formatDate(order.createdAt)}</p>
              </div>
              <div className="mb-2">
                <p className="font-bold text-gray-400 text-xs uppercase">Jadwal Layanan:</p>
                <p className="font-medium text-gray-900">{formatDate(order.scheduledAt)}</p>
              </div>
              <div>
                <p className="font-bold text-gray-400 text-xs uppercase">Mitra:</p>
                <p className="font-medium text-gray-900">{providerName}</p>
              </div>
            </div>
          </div>

          {/* Tabel Item */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-gray-900 text-gray-900">
                <th className="py-3 text-left font-bold w-1/2">Layanan / Deskripsi</th>
                <th className="py-3 text-center font-bold">Qty</th>
                <th className="py-3 text-right font-bold">Harga Satuan</th>
                <th className="py-3 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {order.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3">
                    <p className="font-bold text-gray-900">{item.name}</p>
                    {item.note && <p className="text-xs text-gray-500 italic">"{item.note}"</p>}
                  </td>
                  <td className="py-3 text-center">{item.quantity}</td>
                  <td className="py-3 text-right">{formatCurrency(item.price)}</td>
                  <td className="py-3 text-right font-medium">{formatCurrency(item.price * item.quantity)}</td>
                </tr>
              ))}

              {/* Biaya Tambahan */}
              {order.additionalFees && order.additionalFees.length > 0 && order.additionalFees.map((fee, idx) => (
                fee.status !== 'rejected' && (
                  <tr key={`fee-${idx}`} className="border-b border-gray-100 bg-gray-50/50">
                    <td className="py-3">
                      <span className="text-gray-600">{fee.description}</span>
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-gray-200 rounded text-gray-600">TAMBAHAN</span>
                    </td>
                    <td className="py-3 text-center">1</td>
                    <td className="py-3 text-right">{formatCurrency(fee.amount)}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(fee.amount)}</td>
                  </tr>
                )
              ))}
            </tbody>
          </table>

          {/* Total Section */}
          <div className="flex justify-end mb-12">
            <div className="w-1/2 space-y-2">
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Biaya Layanan (Admin)</span>
                <span>{formatCurrency(order.adminFee || 0)}</span>
              </div>

              {totalAdditionalFees > 0 && (
                 <div className="flex justify-between text-gray-600 text-sm">
                   <span>Total Biaya Tambahan</span>
                   <span>{formatCurrency(totalAdditionalFees)}</span>
                 </div>
              )}

              {order.discountAmount && order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600 text-sm">
                  <span>Diskon</span>
                  <span>-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-xl font-bold text-gray-900 border-t-2 border-gray-900 pt-3 mt-2">
                <span>Total Tagihan</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-6 text-center text-xs text-gray-500">
             <p className="mb-1">Terima kasih atas kepercayaan Anda menggunakan layanan POSKO.</p>
             <p>Bukti pembayaran ini sah dan diterbitkan secara elektronik.</p>
             <p className="mt-4 font-mono text-[10px] text-gray-300">Generated at: {new Date().toLocaleString('id-ID')}</p>
          </div>

        </div>
      </div>
    </div>
  );
}