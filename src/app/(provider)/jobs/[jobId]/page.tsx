// src/app/(provider)/jobs/[jobId]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.jobId;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10 px-6 py-4 border-b border-gray-200 flex items-center gap-4">
        <Link href="/jobs" className="p-2 -ml-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-full transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Detail Pekerjaan</h1>
          <p className="text-xs text-gray-500">ID: {jobId}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
          <p className="text-gray-500">Halaman detail pekerjaan akan ditampilkan di sini.</p>
          <p className="text-sm text-gray-400 mt-2">Job ID: {jobId}</p>
        </div>
      </main>
    </div>
  );
}