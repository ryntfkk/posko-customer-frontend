// src/app/(provider)/settings/page.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ProviderSettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10 px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-xs text-gray-500">Kelola profil dan pengaturan akun Anda</p>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'profile', label: 'Profil' },
            { id: 'services', label: 'Layanan' },
            { id: 'schedule', label: 'Jadwal' },
            { id: 'account', label: 'Akun' },
          ].map((tab) => (
            <button
              key={tab. id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab. id
                  ?  'bg-red-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Informasi Profil</h2>
              
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden relative">
                  <Image
                    src="https://api.dicebear.com/7. x/avataaars/svg? seed=provider"
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800">
                    Ubah Foto
                  </button>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG max 2MB</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Lengkap</label>
                  <input
                    type="text"
                    defaultValue="Ahmad Teknisi"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nomor WhatsApp</label>
                  <input
                    type="tel"
                    defaultValue="081234567890"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Bio / Deskripsi</label>
                <textarea
                  rows={3}
                  defaultValue="Teknisi berpengalaman dengan 5+ tahun pengalaman di bidang AC dan elektronik rumah tangga."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                />
              </div>

              <button className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors">
                Simpan Perubahan
              </button>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Layanan Aktif</h2>
              <p className="text-sm text-gray-500">Kelola layanan yang Anda tawarkan</p>
              
              <div className="space-y-3">
                {['Service AC', 'Cuci AC', 'Perbaikan Kulkas']. map((service, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">{service}</p>
                      <p className="text-xs text-gray-500">Rp 150.000 - 300.000</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-red-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Jadwal Kerja</h2>
              <p className="text-sm text-gray-500">Atur hari dan jam operasional Anda</p>
              
              <div className="text-center py-12 text-gray-400">
                <p>Fitur jadwal akan segera hadir</p>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Pengaturan Akun</h2>
              
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                  <span className="font-medium text-gray-900">Ubah Password</span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                  <span className="font-medium text-gray-900">Notifikasi</span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100 hover:bg-red-100 transition-colors">
                  <span className="font-medium text-red-600">Keluar dari Akun</span>
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}