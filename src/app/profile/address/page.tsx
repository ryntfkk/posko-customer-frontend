// src/app/profile/address/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchProfile } from '@/features/auth/api';
import { User, Address } from '@/features/auth/types';

export default function AddressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // State untuk Form Alamat
  const [formData, setFormData] = useState<Address>({
    province: '',
    city: '',
    district: '',
    village: '',
    postalCode: '',
    detail: ''
  });

  // Load data user saat halaman dibuka
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetchProfile();
        setUser(res.data.profile);
        
        // Jika user sudah punya alamat, isi form dengan data tersebut
        if (res.data.profile.address) {
          setFormData({
            province: res.data.profile.address.province || '',
            city: res.data.profile.address.city || '',
            district: res.data.profile.address.district || '',
            village: res.data.profile.address.village || '',
            postalCode: res.data.profile.address.postalCode || '',
            detail: res.data.profile.address.detail || ''
          });
        }
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [router]);

  // Handle perubahan input text
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle tombol Simpan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // TODO: Kita perlu menambahkan fungsi updateProfile di API & Backend
      // await updateProfile({ address: formData });
      
      // Simulasi sukses sementara
      console.log("Data yang akan disimpan:", formData);
      alert("Fitur simpan akan berfungsi setelah update backend di langkah berikutnya.");
      
    } catch (error) {
      alert("Gagal menyimpan alamat.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Memuat...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
        <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Alamat Tersimpan</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-base font-semibold text-gray-900">Alamat Utama</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Alamat ini akan digunakan sebagai lokasi default untuk layanan Home Service.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Grid Layout untuk Provinsi & Kota */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label>
                        <input 
                            type="text"
                            name="province"
                            value={formData.province}
                            onChange={handleChange}
                            placeholder="Contoh: Jawa Tengah"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kota/Kabupaten</label>
                        <input 
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="Contoh: Semarang"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Grid Layout untuk Kecamatan & Desa */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan</label>
                        <input 
                            type="text"
                            name="district"
                            value={formData.district}
                            onChange={handleChange}
                            placeholder="Contoh: Banyumanik"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kelurahan/Desa</label>
                        <input 
                            type="text"
                            name="village"
                            value={formData.village}
                            onChange={handleChange}
                            placeholder="Contoh: Srondol Wetan"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Kode Pos */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kode Pos</label>
                    <input 
                        type="number"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        placeholder="Contoh: 50263"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>

                {/* Detail Jalan */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Detail Jalan / Patokan</label>
                    <textarea 
                        name="detail"
                        value={formData.detail}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Contoh: Jl. Durian Raya No. 15, Pagar Hitam, Depan Indomaret"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                    />
                </div>

                {/* Tombol Simpan */}
                <div className="pt-4">
                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all shadow-md
                            ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'}
                        `}
                    >
                        {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
}