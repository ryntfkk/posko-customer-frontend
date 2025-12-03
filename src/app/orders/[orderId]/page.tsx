// src/app/(customer)/orders/[orderId]/page.tsx
'use client';

import { useEffect, useState, use, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic'; // Untuk import map tanpa SSR

import { fetchOrderById, updateOrderStatus, rejectAdditionalFee } from '@/features/orders/api';
import { createPayment } from '@/features/payments/api';
import { Order, OrderStatus } from '@/features/orders/types';
import useMidtrans from '@/hooks/useMidtrans';
import 'leaflet/dist/leaflet.css';

// --- DYNAMIC IMPORT MAP (Client Only) ---
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// Setup Leaflet Icon (Fix missing icon issue)
import L from 'leaflet';
const RedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// --- ICONS (SVG) ---
const Icons = {
  ChevronLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>,
  MapPin: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  Phone: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>,
  Calendar: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  Clock: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  CheckCircle: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  AlertCircle: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  Chat: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>,
  CreditCard: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>,
  FileText: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l5.414 5.414a1 1 0 01.586 1.414V19a2 2 0 01-2 2z"/></svg>,
  Image: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  XCircle: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
};

// --- HELPERS ---
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
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatTime = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const { orderId } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const isSnapLoaded = useMidtrans();

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const res = await fetchOrderById(orderId);
        setOrder(res.data);
      } catch (error) {
        console.error('Err:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadOrder();
  }, [orderId]);

  // Handle Pay All Pending Fees
  const handlePayment = async () => {
    if (!isSnapLoaded) return alert("Sistem pembayaran sedang memuat...");
    setIsActionLoading(true);
    try {
      // Backend akan otomatis menghitung semua fee yang statusnya 'pending_approval'
      const res = await createPayment(orderId);
      
      if (window.snap) {
        window.snap.pay(res.data.snapToken, {
          onSuccess: () => window.location.reload(),
          onPending: () => window.location.reload(),
          onError: () => alert('Pembayaran Gagal.'),
          onClose: () => setIsActionLoading(false)
        });
      }
    } catch (e) {
      alert('Gagal memproses pembayaran. Pastikan ada tagihan yang harus dibayar.');
      setIsActionLoading(false);
    }
  };

  // Handle Reject Specific Fee
  const handleReject = async (feeId: string) => {
    if (!confirm('Apakah Anda yakin ingin menolak biaya tambahan ini?')) return;
    setIsActionLoading(true);
    try {
      await rejectAdditionalFee(orderId, feeId);
      // Reload order data untuk refresh tampilan
      const res = await fetchOrderById(orderId);
      setOrder(res.data);
    } catch (e) {
      alert('Gagal menolak biaya.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmComplete = async () => {
    if (!confirm('Pekerjaan sudah selesai dengan baik?')) return;
    setIsActionLoading(true);
    try {
      await updateOrderStatus(orderId, 'completed');
      window.location.reload();
    } catch (e) {
      alert('Gagal konfirmasi.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusInfo = (status: OrderStatus) => {
    const map: Record<OrderStatus, { label: string; color: string; bg: string }> = {
      pending: { label: 'Menunggu Pembayaran', color: 'text-amber-600', bg: 'bg-amber-50' },
      paid: { label: 'Dibayar', color: 'text-blue-600', bg: 'bg-blue-50' },
      searching: { label: 'Mencari Mitra', color: 'text-indigo-600', bg: 'bg-indigo-50' },
      accepted: { label: 'Diterima Mitra', color: 'text-cyan-600', bg: 'bg-cyan-50' },
      on_the_way: { label: 'Mitra Jalan', color: 'text-sky-600', bg: 'bg-sky-50' },
      working: { label: 'Sedang Dikerjakan', color: 'text-orange-600', bg: 'bg-orange-50' },
      waiting_approval: { label: 'Konfirmasi Selesai', color: 'text-pink-600', bg: 'bg-pink-50' },
      completed: { label: 'Selesai', color: 'text-emerald-600', bg: 'bg-emerald-50' },
      cancelled: { label: 'Dibatalkan', color: 'text-red-600', bg: 'bg-red-50' },
      failed: { label: 'Gagal', color: 'text-gray-600', bg: 'bg-gray-50' },
    };
    return map[status] || map.pending;
  };

  // Cek apakah ada biaya tambahan yang BELUM dibayar
  const unpaidAdditionalFees = useMemo(() => {
    if (!order?.additionalFees) return 0;
    return order.additionalFees
      .filter(f => f.status === 'pending_approval')
      .reduce((acc, f) => acc + f.amount, 0);
  }, [order]);

  const hasUnpaidFees = unpaidAdditionalFees > 0;

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"/></div>;
  if (!order) return <div className="p-8 text-center text-gray-500">Pesanan tidak ditemukan</div>;

  const statusInfo = getStatusInfo(order.status);
  const providerData = typeof order.providerId === 'object' ? order.providerId : null;

  // Calculate totals
  const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  // Total yang ditampilkan: Base Total + Semua Additional Fee (Paid, Unpaid, Rejected tidak dihitung di total bayar akhir, tapi di list ditampilkan)
  const totalAdditionalFees = order.additionalFees?.reduce((acc, fee) => {
    // Rejected fees tidak menambah total tagihan
    if (fee.status === 'rejected') return acc;
    return acc + fee.amount;
  }, 0) || 0;
  
  const displayGrandTotal = order.totalAmount + totalAdditionalFees;

  // Koordinat Map (Default Jakarta jika null)
  const mapCenter: [number, number] = order.location?.coordinates 
    ? [order.location.coordinates[0], order.location.coordinates[1]]
    : [-6.200000, 106.816666];

  return (
    <div className="min-h-screen bg-gray-50/50 pb-32 font-sans text-gray-900">
      {/* Navbar Simple */}
      <div className="bg-white sticky top-0 z-20 px-4 h-14 flex items-center shadow-sm border-b border-gray-100">
        <Link href="/orders" className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-600">
          <Icons.ChevronLeft />
        </Link>
        <h1 className="ml-2 text-base font-bold">Rincian Pesanan</h1>
      </div>

      <main className="max-w-xl mx-auto p-4 space-y-4">
        
        {/* HEADER STATUS */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide ${statusInfo.bg} ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
              <p className="text-[10px] text-gray-400 mt-2 font-mono tracking-wider">
                {order.orderNumber}
              </p>
            </div>
            <div className="text-right">
               <p className="text-xs text-gray-500">Jadwal</p>
               <div className="flex items-center justify-end gap-1.5 mt-1 text-gray-800">
                 <Icons.Calendar />
                 <span className="text-sm font-semibold">{formatDate(order.scheduledAt)}</span>
               </div>
               <div className="text-xs text-gray-500 mt-0.5">
                  {formatTime(order.scheduledAt)}
                  {order.scheduledTimeSlot?.preferredStart ? ` (${order.scheduledTimeSlot.preferredStart} - ${order.scheduledTimeSlot.preferredEnd})` : ''}
               </div>
            </div>
          </div>

          {/* Progress Bar Visual */}
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
             <div className={`h-full ${['paid', 'searching', 'accepted', 'on_the_way', 'working', 'waiting_approval', 'completed'].includes(order.status) ? 'bg-green-500 w-1/4' : 'w-0'} transition-all duration-500`}></div>
             <div className={`h-full ${['accepted', 'on_the_way', 'working', 'waiting_approval', 'completed'].includes(order.status) ? 'bg-green-500 w-1/4' : 'w-0'} transition-all duration-500`}></div>
             <div className={`h-full ${['working', 'waiting_approval', 'completed'].includes(order.status) ? 'bg-green-500 w-1/4' : 'w-0'} transition-all duration-500`}></div>
             <div className={`h-full ${['completed'].includes(order.status) ? 'bg-green-500 w-1/4' : 'w-0'} transition-all duration-500`}></div>
          </div>
        </div>

        {/* PROVIDER SECTION */}
        {providerData && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-full bg-gray-100 overflow-hidden shrink-0">
               <Image 
                 src={providerData.userId?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${providerData.userId?.fullName}`} 
                 alt="Provider" fill className="object-cover"
               />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">Mitra Pelaksana</p>
              <p className="font-bold text-sm truncate">{providerData.userId?.fullName}</p>
              {providerData.rating && (
                <div className="flex items-center gap-1 text-xs text-yellow-600 mt-0.5">
                  <span>★</span><span>{providerData.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
               {providerData.userId?.phoneNumber && (
                 <a href={`tel:${providerData.userId.phoneNumber}`} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-green-600 transition-colors">
                   <Icons.Phone />
                 </a>
               )}
               <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                 <Icons.Chat />
               </button>
            </div>
          </div>
        )}

        {/* ORDER ITEMS & FEES */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-50 bg-gray-50/30">
             <h3 className="text-sm font-bold flex items-center gap-2">
               <Icons.FileText /> Rincian Biaya
             </h3>
          </div>
          
          <div className="p-4 space-y-3">
            {/* Services */}
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between items-start text-sm">
                 <div className="flex gap-3">
                   <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0 mt-0.5">
                      {item.quantity}x
                   </div>
                   <span className="text-gray-700">{item.name}</span>
                 </div>
                 <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}

            {/* Additional Fees List */}
            {order.additionalFees && order.additionalFees.length > 0 && (
              <div className="border-t border-dashed border-gray-200 pt-3 mt-3 bg-orange-50/50 p-3 rounded-xl border-orange-100">
                <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Biaya Tambahan (Add-on)</p>
                {order.additionalFees.map((fee, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm mb-2 last:mb-0 gap-2">
                    <div className="flex-1">
                      <span className={`block font-medium ${fee.status === 'rejected' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                        {fee.description}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            fee.status === 'paid' ? 'bg-green-100 text-green-700' : 
                            fee.status === 'rejected' ? 'bg-gray-200 text-gray-500' :
                            'bg-yellow-100 text-yellow-700 font-bold'
                        }`}>
                            {fee.status === 'pending_approval' ? 'Menunggu Konfirmasi' : 
                             fee.status === 'rejected' ? 'Ditolak' : fee.status}
                        </span>
                        
                        {/* TOMBOL TOLAK (Hanya jika pending) */}
                        {fee.status === 'pending_approval' && (
                            <button 
                                onClick={() => handleReject(fee._id)}
                                disabled={isActionLoading}
                                className="text-[10px] bg-white border border-red-200 text-red-600 px-2 py-0.5 rounded-md hover:bg-red-50 flex items-center gap-1"
                            >
                                <Icons.XCircle /> Tolak
                            </button>
                        )}
                      </div>
                    </div>
                    <span className={`font-bold ${fee.status === 'rejected' ? 'text-gray-400' : 'text-orange-600'}`}>
                        +{formatCurrency(fee.amount)}
                    </span>
                  </div>
                ))}

                {/* TOMBOL BAYAR (Muncul di bawah list jika ada yang pending) */}
                {hasUnpaidFees && (
                    <div className="mt-4 pt-3 border-t border-orange-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-orange-800 font-semibold">Total Tagihan Tambahan</span>
                            <span className="text-sm font-bold text-orange-700">{formatCurrency(unpaidAdditionalFees)}</span>
                        </div>
                        <button 
                            onClick={handlePayment}
                            disabled={isActionLoading}
                            className="w-full py-2 bg-orange-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-orange-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Icons.CreditCard /> Bayar Tagihan Tambahan
                        </button>
                    </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-4 space-y-2 text-sm border-t border-gray-100">
            <div className="flex justify-between text-gray-500">
               <span>Subtotal Layanan</span>
               <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
               <span>Biaya Admin</span>
               <span>{formatCurrency(order.adminFee)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Diskon Voucher</span>
                <span>-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200 text-gray-900">
               <span>Total Keseluruhan</span>
               <span>{formatCurrency(displayGrandTotal)}</span>
            </div>
          </div>
        </div>

        {/* DETAILS (Location & Map, Contact, Note) */}
        <div className="space-y-4">
           {/* LOCATION & MAP */}
           <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
             <div className="p-4 border-b border-gray-50">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-2">
                 <Icons.MapPin /> Lokasi Pengerjaan
               </h3>
               {order.shippingAddress && (
                 <div className="text-sm text-gray-700 mt-2 space-y-1">
                   <p className="font-medium">{order.shippingAddress.detail}</p>
                   <p className="text-gray-500 text-xs">
                     {order.shippingAddress.village}, {order.shippingAddress.district}, {order.shippingAddress.city}
                   </p>
                   {order.propertyDetails?.type && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
                        <span>🏠 {order.propertyDetails.type}</span>
                        {order.propertyDetails.floor && <span>• Lt. {order.propertyDetails.floor}</span>}
                      </div>
                   )}
                 </div>
               )}
             </div>
             
             {/* MAP DISPLAY */}
             <div className="h-48 w-full z-0 relative">
               <MapContainer 
                  center={mapCenter} 
                  zoom={15} 
                  scrollWheelZoom={false} 
                  dragging={false}
                  zoomControl={false}
                  className="h-full w-full"
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© OpenStreetMap'
                  />
                  <Marker position={mapCenter} icon={RedIcon}>
                    <Popup>Lokasi Pesanan</Popup>
                  </Marker>
                </MapContainer>
                {/* Overlay to prevent interaction if desired, or make it a link to maps */}
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${mapCenter[0]},${mapCenter[1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 bg-white/90 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 shadow-sm z-[400] flex items-center gap-1"
                >
                  Buka Google Maps <Icons.ChevronLeft />
                </a>
             </div>
           </div>

           {/* CONTACT & NOTE GRID */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* CONTACT */}
               {order.customerContact && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Icons.Phone /> Kontak Penerima
                    </h3>
                    <div className="text-sm">
                       <p className="font-medium text-gray-900">{order.customerContact.name || 'Sesuai Akun'}</p>
                       <div className="flex items-center justify-between mt-1">
                          <p className="text-gray-600">{order.customerContact.phone}</p>
                          <a href={`tel:${order.customerContact.phone}`} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold">
                             Panggil
                          </a>
                       </div>
                       {order.customerContact.alternatePhone && (
                         <p className="text-gray-400 text-xs mt-2 border-t border-dashed border-gray-200 pt-2">
                           Alt: {order.customerContact.alternatePhone}
                         </p>
                       )}
                    </div>
                  </div>
               )}

               {/* NOTE */}
               {order.orderNote && (
                 <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 text-sm text-amber-900">
                    <h3 className="font-bold text-xs text-amber-600 mb-2 uppercase flex items-center gap-2">
                      <Icons.FileText /> Catatan Khusus
                    </h3>
                    <p className="italic">"{order.orderNote}"</p>
                 </div>
               )}
           </div>
        </div>

        {/* LAMPIRAN AWAL */}
        {order.attachments && order.attachments.length > 0 && (
           <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-gray-500 px-1 uppercase">Foto Kondisi Awal</h3>
              <div className="grid grid-cols-3 gap-2">
                {order.attachments.map((att, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-white border border-gray-200">
                    <Image src={att.url} alt="Att" fill className="object-cover" />
                  </div>
                ))}
              </div>
           </div>
        )}

        {/* BUKTI PENYELESAIAN */}
        {order.completionEvidence && order.completionEvidence.length > 0 && (
           <div className="bg-green-50 rounded-2xl p-4 border border-green-100 space-y-3 mt-4">
              <h3 className="text-sm font-bold text-green-800 flex items-center gap-2">
                <Icons.CheckCircle /> Bukti Pekerjaan Selesai
              </h3>
              <div className="grid grid-cols-2 gap-3">
                 {order.completionEvidence.map((ev, i) => (
                    <div key={i} className="space-y-1">
                       <div className="relative aspect-video rounded-lg overflow-hidden border border-green-200 shadow-sm bg-white">
                         <Image src={ev.url} alt="Bukti" fill className="object-cover" />
                       </div>
                       {ev.description && <p className="text-[10px] text-green-700 line-clamp-1">{ev.description}</p>}
                    </div>
                 ))}
              </div>
           </div>
        )}

      </main>

      {/* FLOATING BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex gap-3 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        
        {/* Case: Pending Payment (Initial Order) */}
        {order.status === 'pending' && (
          <button 
            onClick={handlePayment} 
            disabled={isActionLoading}
            className="flex-1 h-12 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isActionLoading ? 'Memproses...' : <><Icons.CreditCard /> Bayar Sekarang</>}
          </button>
        )}

        {/* Case: Waiting Approval (Customer Confirm) */}
        {order.status === 'waiting_approval' && !hasUnpaidFees && (
          <button 
            onClick={handleConfirmComplete}
            disabled={isActionLoading}
            className="flex-1 h-12 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Icons.CheckCircle /> Konfirmasi Selesai
          </button>
        )}

        {/* Case: Completed (Review) */}
        {order.status === 'completed' && (
          <button className="flex-1 h-12 bg-gray-900 text-white font-bold rounded-xl active:scale-95 transition-all">
            Beri Ulasan
          </button>
        )}
        
        {/* Default / No Action */}
        {!['pending', 'waiting_approval', 'completed'].includes(order.status) && (
           <div className="flex-1 flex items-center justify-center text-sm text-gray-400 font-medium">
             {order.status === 'cancelled' ? 'Pesanan Dibatalkan' : 'Tidak ada aksi diperlukan saat ini'}
           </div>
        )}
      </div>
    </div>
  );
}