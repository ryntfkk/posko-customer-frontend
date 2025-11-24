// src/components/ProviderHome.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User } from '@/features/auth/types';
import { fetchIncomingOrders, acceptOrder, fetchMyOrders } from '@/features/orders/api';
import { Order } from '@/features/orders/types';
// [UPDATE] Import fungsi updateProviderSchedule
import { updateProviderSchedule } from '@/features/providers/api';
import { ScheduleDay } from '@/features/providers/types'; 
import ProviderBottomNav from '@/components/provider/ProviderBottomNav';

// --- DEFAULT SCHEDULE ---
// Jadwal default: Senin-Jumat (09:00 - 17:00), Sabtu (09:00-14:00), Minggu Libur
const DEFAULT_SCHEDULE: ScheduleDay[] = [
    { dayIndex: 0, dayName: 'Minggu', isOpen: false, start: '09:00', end: '17:00' },
    { dayIndex: 1, dayName: 'Senin', isOpen: true, start: '09:00', end: '17:00' },
    { dayIndex: 2, dayName: 'Selasa', isOpen: true, start: '09:00', end: '17:00' },
    { dayIndex: 3, dayName: 'Rabu', isOpen: true, start: '09:00', end: '17:00' },
    { dayIndex: 4, dayName: 'Kamis', isOpen: true, start: '09:00', end: '17:00' },
    { dayIndex: 5, dayName: 'Jumat', isOpen: true, start: '09:00', end: '17:00' },
    { dayIndex: 6, dayName: 'Sabtu', isOpen: true, start: '09:00', end: '14:00' },
];

// --- ICONS ---
const WalletIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>;
const StarIcon = () => <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>;
const LocationIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
const ClockIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

interface ProviderHomeProps {
  user: User;
}

export default function ProviderHome({ user }: ProviderHomeProps) {
  // Safety Check
  if (!user) return null;

  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'incoming' | 'active' | 'history'>('incoming');
  
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([]);
  const [myJobs, setMyJobs] = useState<Order[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // State Jadwal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false); // [BARU] Loading state untuk save
  
  // Mengambil jadwal dari user.schedule (jika sudah ada dari backend), jika tidak pakai default
  const [schedule, setSchedule] = useState<ScheduleDay[]>(
    (user.schedule && user.schedule.length > 0) ? user.schedule : DEFAULT_SCHEDULE
  );

  useEffect(() => {
    const initData = async () => {
        try {
            // 1. Ambil Riwayat Pekerjaan
            const jobsRes = await fetchMyOrders('provider');
            setMyJobs(Array.isArray(jobsRes.data) ? jobsRes.data : []);

            // 2. Ambil Order Masuk
            const incomingRes = await fetchIncomingOrders();
            setIncomingOrders(Array.isArray(incomingRes.data) ? incomingRes.data : []);

        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    initData();
  }, []);

  // Statistik
  const activeJobs = useMemo(() => {
    return myJobs.filter(o => ['accepted', 'on_the_way', 'working', 'waiting_approval'].includes(o.status));
  }, [myJobs]);

  const historyJobs = useMemo(() => {
    return myJobs.filter(o => ['completed', 'cancelled', 'failed'].includes(o.status));
  }, [myJobs]);

  const completedCount = useMemo(() => {
    return myJobs.filter(o => o.status === 'completed').length;
  }, [myJobs]);

  const totalEarnings = useMemo(() => {
    return myJobs
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [myJobs]);

  const rating = 5.0; 

  // Handler: Terima Order
  const handleAccept = async (orderId: string) => {
    if (!confirm('Ambil pesanan ini?')) return;
    setProcessingId(orderId);
    try {
      await acceptOrder(orderId);
      alert('Pesanan diterima! Cek tab Berlangsung.');
      // Refresh data
      const incRes = await fetchIncomingOrders();
      setIncomingOrders(incRes.data);
      const jobsRes = await fetchMyOrders('provider');
      setMyJobs(jobsRes.data);
      setActiveTab('active');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal terima order');
    } finally {
      setProcessingId(null);
    }
  };

  // Handler: Update State Jadwal Lokal
  const updateDaySchedule = (index: number, field: keyof ScheduleDay, value: any) => {
      const newSchedule = [...schedule];
      newSchedule[index] = { ...newSchedule[index], [field]: value };
      setSchedule(newSchedule);
  };

  // Handler: Simpan Jadwal (Ke Backend Real)
  const handleSaveSchedule = async () => {
      setIsSavingSchedule(true);
      try {
          // Panggil API update
          await updateProviderSchedule(schedule);
          alert("Jadwal operasional berhasil diperbarui!");
          setIsScheduleModalOpen(false);
      } catch (error: any) {
          console.error(error);
          const msg = error.response?.data?.message || "Gagal menyimpan jadwal";
          // Jika error validasi, tampilkan detail
          const validationErrors = error.response?.data?.errors;
          if (validationErrors) {
              alert(`${msg}: ${validationErrors[0].message}`);
          } else {
              alert(msg);
          }
      } finally {
          setIsSavingSchedule(false);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24 lg:pb-10">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8"><Image src="/logo.png" alt="Posko" fill className="object-contain"/></div>
            <div><h1 className="text-lg font-extrabold text-gray-900 leading-none">Mitra<span className="text-red-600">Posko</span></h1></div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/profile">
                <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
                    <Image src={user.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.fullName}`} width={36} height={36} className="w-full h-full object-cover" alt="Profile"/>
                </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* DASHBOARD STATS & TOMBOL ATUR JADWAL */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card Utama */}
            <div className="lg:col-span-2 bg-gradient-to-r from-red-700 to-red-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-red-100">
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl lg:text-3xl font-bold mb-1">Halo, {user.fullName.split(' ')[0]}! 👋</h2>
                            <p className="text-red-100 text-sm lg:text-base opacity-90">Pantau performa dan atur jadwalmu.</p>
                        </div>
                        
                        {/* Trigger Modal Jadwal */}
                        <button 
                            onClick={() => setIsScheduleModalOpen(true)} 
                            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full text-xs font-bold transition-all backdrop-blur-sm border border-white/10"
                        >
                            <ClockIcon /> Atur Jadwal
                        </button>
                    </div>

                    <div className="mt-8 grid grid-cols-3 gap-4 divide-x divide-red-600/30">
                        <div className="pr-4">
                            <p className="text-xs text-red-200 mb-1">Rating</p>
                            <div className="flex items-center gap-1 text-lg lg:text-2xl font-bold">{rating} <StarIcon /></div>
                        </div>
                        <div className="px-4">
                            <p className="text-xs text-red-200 mb-1">Selesai</p>
                            <p className="text-lg lg:text-2xl font-bold">{completedCount} Job</p>
                        </div>
                        <div className="pl-4">
                            <p className="text-xs text-red-200 mb-1">Saldo</p>
                            {/* Pastikan user.balance ada di tipe User, atau default ke 0 */}
                            <p className="text-lg lg:text-xl font-bold">Rp {new Intl.NumberFormat('id-ID').format(user.balance || 0)}</p>
                        </div>
                    </div>
                </div>
                <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* Card Pendapatan */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-4 text-gray-500">
                        <div className="p-2 bg-gray-100 rounded-lg"><WalletIcon /></div>
                        <span className="text-xs font-bold uppercase tracking-wide">Total Pendapatan</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900 mb-1">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalEarnings)}
                    </p>
                    <p className="text-xs text-gray-400">Akumulasi dari pesanan selesai</p>
                </div>
                <button className="w-full mt-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors">
                    Riwayat Transaksi
                </button>
            </div>
        </section>

        {/* TABS NAVIGASI ORDER */}
        <section>
            <div className="flex gap-6 border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('incoming')} className={`pb-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'incoming' ? 'text-red-600 border-red-600' : 'text-gray-400 border-transparent'}`}>
                    Masuk <span className="ml-1 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px]">{incomingOrders.length}</span>
                </button>
                <button onClick={() => setActiveTab('active')} className={`pb-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'active' ? 'text-red-600 border-red-600' : 'text-gray-400 border-transparent'}`}>
                    Berlangsung <span className="ml-1 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[10px]">{activeJobs.length}</span>
                </button>
                <button onClick={() => setActiveTab('history')} className={`pb-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'history' ? 'text-red-600 border-red-600' : 'text-gray-400 border-transparent'}`}>
                    Riwayat
                </button>
            </div>

            {/* KONTEN: ORDER MASUK */}
            {activeTab === 'incoming' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {incomingOrders.length === 0 ? (
                        <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
                            <p className="text-gray-400">Belum ada pesanan masuk.</p>
                        </div>
                    ) : (
                        incomingOrders.map((order) => (
                            <div key={order._id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                                {order.orderType === 'direct' && <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold">DIRECT</div>}
                                {order.status === 'paid' && <div className="absolute top-0 right-0 bg-green-600 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold">PAID</div>}
                                
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold uppercase line-clamp-1">
                                        {order.items[0]?.name} {order.items.length > 1 && `+${order.items.length-1}`}
                                    </span>
                                    <span className="text-xs font-bold text-green-600">Rp {new Intl.NumberFormat('id-ID').format(order.totalAmount)}</span>
                                </div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0">
                                        {/* @ts-ignore: Populate user */}
                                        <Image src={order.userId?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${order.userId?.fullName}`} width={40} height={40} alt="Cust" className="object-cover"/>
                                    </div>
                                    <div>
                                        {/* @ts-ignore */}
                                        <h3 className="font-bold text-gray-900 text-sm">{order.userId?.fullName}</h3>
                                        {/* @ts-ignore */}
                                        <p className="text-xs text-gray-500 flex items-center gap-1"><LocationIcon /> {order.userId?.address?.city || 'Lokasi...'}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleAccept(order._id)} disabled={!!processingId} className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 transition-colors shadow-lg shadow-red-100">
                                    {processingId === order._id ? '...' : 'Terima Order'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* KONTEN: ORDER BERLANGSUNG */}
            {activeTab === 'active' && (
                <div className="space-y-4">
                    {activeJobs.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">Tidak ada pekerjaan aktif.</div>
                    ) : (
                        activeJobs.map((order) => (
                            <Link href={`/provider/jobs/${order._id}`} key={order._id} className="block bg-white p-5 rounded-2xl border-l-4 border-blue-600 shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                                            <span className="text-xs font-bold text-blue-700 uppercase">{order.status.replace(/_/g, ' ')}</span>
                                        </div>
                                        <h3 className="text-base font-bold text-gray-900">{order.items[0].name}</h3>
                                        {/* @ts-ignore */}
                                        <p className="text-sm text-gray-500 mt-1">{order.userId?.fullName} • {order.userId?.address?.city}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-gray-900">Rp {new Intl.NumberFormat('id-ID').format(order.totalAmount)}</p>
                                        <span className="text-xs text-gray-400 font-mono">#{order._id.slice(-4)}</span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            )}

            {/* KONTEN: RIWAYAT */}
            {activeTab === 'history' && (
                <div className="space-y-3">
                    {historyJobs.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">Belum ada riwayat pekerjaan.</div>
                    ) : (
                        historyJobs.map((order) => (
                            <div key={order._id} className="flex justify-between items-center p-4 bg-white rounded-xl border border-gray-100">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">{order.items[0].name}</h4>
                                    <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('id-ID')}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {order.status}
                                    </span>
                                    <p className="text-xs font-bold text-gray-700 mt-1">Rp {new Intl.NumberFormat('id-ID').format(order.totalAmount)}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </section>
      </div>

      {/* [MODAL ATUR JADWAL] */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                {/* Modal Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        <ClockIcon /> Atur Jam Operasional
                    </h3>
                    <button onClick={() => setIsScheduleModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">✕</button>
                </div>

                {/* Modal Body (Scrollable) */}
                <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar bg-gray-50/50">
                    <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-xl border border-blue-100 flex gap-2 items-start">
                        <span>ℹ️</span>
                        <p>Atur ketersediaan agar pelanggan hanya bisa memesan layanan Direct Order di jam kerja Anda (WIB).</p>
                    </div>

                    {schedule.map((day, idx) => (
                        <div key={day.dayName} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${day.isOpen ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-100 border-transparent opacity-75'}`}>
                            {/* Checkbox Hari */}
                            <div className="w-24 font-bold text-sm text-gray-700 flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    checked={day.isOpen} 
                                    onChange={(e) => updateDaySchedule(idx, 'isOpen', e.target.checked)} 
                                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300"
                                />
                                {day.dayName}
                            </div>

                            {/* Input Jam */}
                            {day.isOpen ? (
                                <div className="flex items-center gap-2 flex-1">
                                    <div className="relative flex-1">
                                        <input 
                                            type="time" 
                                            value={day.start} 
                                            onChange={(e) => updateDaySchedule(idx, 'start', e.target.value)} 
                                            className="w-full p-1.5 text-sm font-medium border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-100 outline-none text-center"
                                        />
                                    </div>
                                    <span className="text-gray-400 font-bold">-</span>
                                    <div className="relative flex-1">
                                        <input 
                                            type="time" 
                                            value={day.end} 
                                            onChange={(e) => updateDaySchedule(idx, 'end', e.target.value)} 
                                            className="w-full p-1.5 text-sm font-medium border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-100 outline-none text-center"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <span className="text-xs text-gray-400 italic flex-1 text-center font-medium">Tutup / Libur</span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
                    <button 
                        onClick={() => setIsScheduleModalOpen(false)} 
                        className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                        disabled={isSavingSchedule}
                    >
                        Batal
                    </button>
                    <button 
                        onClick={handleSaveSchedule}
                        disabled={isSavingSchedule}
                        className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-100 transition-all hover:-translate-y-0.5 flex items-center gap-2 disabled:bg-gray-300 disabled:shadow-none"
                    >
                        {isSavingSchedule ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Menyimpan...
                            </>
                        ) : (
                            'Simpan Jadwal'
                        )}
                    </button>
                </div>
            </div>
        </div>
      )}

      <ProviderBottomNav />
    </div>
  );
}