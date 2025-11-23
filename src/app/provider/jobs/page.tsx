// src/app/provider/jobs/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchMyOrders } from '@/features/orders/api';
import { Order } from '@/features/orders/types';

export default function ProviderJobsPage() {
  const [jobs, setJobs] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const loadJobs = async () => {
    try {
      // [UPDATE] Explicitly request provider jobs
      const res = await fetchMyOrders('provider');
      setJobs(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Gagal memuat pekerjaan:', error);
    } finally {
      setIsLoading(false);
    }
  };
  loadJobs();
}, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'on_the_way': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'working': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted': return 'Siap Dikerjakan';
      case 'on_the_way': return 'Menuju Lokasi';
      case 'working': return 'Sedang Bekerja';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  if (isLoading) return <div className="min-h-screen flex justify-center items-center bg-gray-50 text-sm text-gray-500">Memuat pekerjaan...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">Pekerjaan Saya</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {jobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center opacity-50">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
            </div>
            <h3 className="font-bold text-gray-900">Belum ada pekerjaan</h3>
            <p className="text-sm text-gray-500 mt-1">Ambil order dari menu Beranda untuk mulai bekerja.</p>
            <Link href="/provider/dashboard" className="mt-4 inline-block text-red-600 font-bold text-sm hover:underline">Cari Order Masuk</Link>
          </div>
        ) : (
          jobs.map((job) => (
            <Link href={`/provider/jobs/${job._id}`} key={job._id} className="block bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-red-200 transition-all">
              <div className="flex justify-between items-start mb-3">
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${getStatusColor(job.status)}`}>
                  {getStatusLabel(job.status)}
                </span>
                <span className="text-xs text-gray-400">{new Date(job.createdAt).toLocaleDateString('id-ID')}</span>
              </div>

              <div className="flex items-center gap-4 mb-3">
                 {/* @ts-ignore: Populate user */}
                 <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                    {/* @ts-ignore */}
                    <Image src={job.userId?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${job.userId?.fullName}`} width={48} height={48} alt="Cust" className="object-cover"/>
                 </div>
                 <div>
                    {/* @ts-ignore */}
                    <h3 className="font-bold text-gray-900">{job.userId?.fullName || 'Pelanggan'}</h3>
                    {/* @ts-ignore */}
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{job.userId?.address?.city || 'Alamat tidak tersedia'}</p>
                 </div>
              </div>

              <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                 <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase">Layanan</span>
                    <span className="text-sm font-medium text-gray-800">{job.items[0]?.name} {job.items.length > 1 && `+${job.items.length - 1}`}</span>
                 </div>
                 <div className="flex flex-col text-right">
                    <span className="text-[10px] text-gray-400 uppercase">Pendapatan</span>
                    <span className="text-sm font-black text-green-600">Rp {new Intl.NumberFormat('id-ID').format(job.totalAmount)}</span>
                 </div>
              </div>
            </Link>
          ))
        )}
      </main>
    </div>
  );
}