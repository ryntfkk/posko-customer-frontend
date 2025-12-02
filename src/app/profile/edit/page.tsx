// src/app/profile/edit/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { fetchProfile, updateProfile } from '@/features/auth/api';
import { User } from '@/features/auth/types';

export default function EditProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State Data
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State Form
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '', // Read-only usually
    birthDate: '',
    gender: '', // Perlu dipastikan backend support field ini di update
  });

  // State Gambar
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 1. Load Profil Saat Ini
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchProfile();
        const profile = res.data.profile;
        setUser(profile);
        
        // Pre-fill form
        setFormData({
          fullName: profile.fullName || '',
          phoneNumber: profile.phoneNumber || '',
          email: profile.email || '',
          birthDate: profile.birthDate ? new Date(profile.birthDate).toISOString().split('T')[0] : '',
          gender: (profile as any).gender || '', // Casting any jika tipe User belum update
        });

        // Set preview image awal
        setPreviewImage(profile.profilePictureUrl || null);
      } catch (error) {
        console.error('Gagal memuat profil:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [router]);

  // 2. Handle Perubahan Input Text
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 3. Handle Pilih Gambar
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validasi Ukuran (Max 2MB misalnya)
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran file terlalu besar (Maks. 2MB)");
        return;
      }

      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file)); // Preview lokal instan
    }
  };

  // 4. Submit Data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Skenario 1: Mengirim JSON (Jika backend handle JSON biasa)
      // Skenario 2: Mengirim FormData (Untuk upload file)
      
      // Kita gunakan FormData untuk mengakomodir upload file
      const payload = new FormData();
      payload.append('fullName', formData.fullName);
      payload.append('phoneNumber', formData.phoneNumber);
      payload.append('birthDate', formData.birthDate);
      payload.append('gender', formData.gender);
      
      if (selectedFile) {
        payload.append('profilePicture', selectedFile);
      }

      // NOTE: Jika api.ts menggunakan default header JSON, 
      // Axios biasanya otomatis mendeteksi FormData dan menghapus header Content-Type JSON
      // Namun jika updateProfile di api.ts strict, Anda mungkin perlu menyesuaikan di sana.
      
      await updateProfile(payload); // Pastikan backend menerima FormData atau sesuaikan payload jadi JSON jika file upload terpisah
      
      alert("Profil berhasil diperbarui!");
      router.push('/profile'); // Kembali ke halaman profil
      router.refresh();
      
    } catch (error: any) {
      console.error("Gagal update:", error);
      alert(error.response?.data?.message || "Gagal memperbarui profil.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans text-gray-800">
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30 px-4 py-3 flex items-center gap-4">
        <Link href="/profile" className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-base font-bold text-gray-900">Edit Profil</h1>
      </header>

      <main className="max-w-lg mx-auto p-4 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section Foto Profil */}
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-200 relative">
                {previewImage ? (
                  <Image 
                    src={previewImage} 
                    alt="Preview" 
                    fill 
                    className="object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                )}
                
                {/* Overlay Edit */}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
              </div>
              <button type="button" className="absolute bottom-0 right-0 bg-red-600 text-white p-1.5 rounded-full shadow-sm border-2 border-white">
                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 font-medium">Ketuk untuk ubah foto</p>
            
            {/* Hidden Input File */}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Section Form Fields */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            
            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Nama Lengkap</label>
              <input 
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Masukkan nama lengkap"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none"
              />
            </div>

            {/* Email (Read Only) */}
            <div className="space-y-1.5 opacity-60">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Email (Tidak dapat diubah)</label>
              <input 
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-600 cursor-not-allowed"
              />
            </div>

            {/* Nomor HP */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Nomor WhatsApp</label>
              <input 
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Contoh: 08123456789"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none"
              />
            </div>

            {/* Tanggal Lahir & Gender Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tgl. Lahir</label>
                    <input 
                        type="date"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Jenis Kelamin</label>
                    <div className="relative">
                        <select 
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none appearance-none"
                        >
                            <option value="">Pilih</option>
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>
            </div>

          </div>

          {/* Tombol Simpan */}
          <div className="sticky bottom-4 z-20">
            <button 
              type="submit"
              disabled={isSaving}
              className={`w-full py-3.5 rounded-xl font-bold text-white text-sm shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2
                ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 active:scale-[0.98]'}
              `}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}