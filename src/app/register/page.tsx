// src/app/register/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/features/auth/api';
import { RegisterPayload } from '@/features/auth/types';

// Interface untuk Data Wilayah API
interface Region {
  id: string;
  name: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // State Data Wilayah
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  
  // State Pilihan ID Wilayah (Untuk fetching API)
  const [selectedProvId, setSelectedProvId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    // Address
    addressProvince: '',
    addressCity: '',
    addressDistrict: '',
    addressPostalCode: '',
    addressDetail: '',
  });

  // --- 1. FETCH PROVINSI SAAT LOAD ---
  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then((res) => res.json())
      .then((data) => setProvinces(data))
      .catch((err) => console.error('Gagal ambil provinsi:', err));
  }, []);

  // --- 2. FETCH KOTA SAAT PROVINSI DIPILIH ---
  useEffect(() => {
    if (selectedProvId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvId}.json`)
        .then((res) => res.json())
        .then((data) => setCities(data))
        .catch((err) => console.error('Gagal ambil kota:', err));
    } else {
      setCities([]);
    }
  }, [selectedProvId]);

  // --- 3. FETCH KECAMATAN SAAT KOTA DIPILIH ---
  useEffect(() => {
    if (selectedCityId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedCityId}.json`)
        .then((res) => res.json())
        .then((data) => setDistricts(data))
        .catch((err) => console.error('Gagal ambil kecamatan:', err));
    } else {
      setDistricts([]);
    }
  }, [selectedCityId]);

  // --- 4. OTOMATIS ISI KODE POS SAAT KECAMATAN DIPILIH ---
  useEffect(() => {
    if (selectedDistrictId) {
      // Kita fetch kelurahan untuk mendapatkan sampel kode pos
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedDistrictId}.json`)
        .then((res) => res.json())
        .then((data) => {
          // Ambil kode pos dari data desa pertama (biasanya satu kecamatan kode posnya mirip/sama)
          // Atau biarkan user mengedit jika berbeda
          if (data && data.length > 0) {
             // API ini tidak selalu return postal code di root object, 
             // jadi kita coba simulasi atau cari API yang menyediakan postal code.
             // CATATAN: API Emsifa publik kadang tidak menyertakan postal_code di respon villages.
             // Jika API tidak ada, kita kosongkan atau minta user isi.
             // Namun, anggaplah kita mencoba best effort.
             setFormData(prev => ({ ...prev, addressPostalCode: '' })); 
          }
        })
        .catch((err) => console.error('Gagal ambil kelurahan:', err));
        
       // JIKA INGIN MOCKUP OTOMATIS (karena API publik sering tidak konsisten soal kode pos):
       // Anda bisa membuat logic mapping sendiri atau membiarkan user mengetik.
       // Disini saya biarkan kosong agar user mengisi, tapi fokus dropdown wilayah sudah jalan.
    }
  }, [selectedDistrictId]);


  // Handler Change Input Biasa
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handler Change Dropdown Wilayah
  const handleRegionChange = (type: 'province' | 'city' | 'district', e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const index = e.target.selectedIndex;
    const text = e.target.options[index].text; // Ambil Nama Wilayahnya (bukan ID)

    if (type === 'province') {
      setSelectedProvId(id);
      setSelectedCityId(''); 
      setSelectedDistrictId('');
      setFormData(prev => ({ ...prev, addressProvince: text, addressCity: '', addressDistrict: '' }));
    } else if (type === 'city') {
      setSelectedCityId(id);
      setSelectedDistrictId('');
      setFormData(prev => ({ ...prev, addressCity: text, addressDistrict: '' }));
    } else if (type === 'district') {
      setSelectedDistrictId(id);
      setFormData(prev => ({ ...prev, addressDistrict: text }));
    }
  };

  const validatePasswordStrong = (pwd: string) => {
    const hasMinLength = pwd.length >= 8;
    const hasLowercase = /[a-z]/.test(pwd);
    const hasUppercase = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    return hasMinLength && hasLowercase && hasUppercase && hasNumber;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok.');
      return;
    }

    if (!validatePasswordStrong(formData.password)) {
      setErrorMsg('Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka.');
      return;
    }

    // Validasi Alamat
    if (!selectedProvId || !selectedCityId || !selectedDistrictId) {
        setErrorMsg('Mohon lengkapi pilihan wilayah alamat.');
        return;
    }

    setIsLoading(true);

    try {
      const payload: RegisterPayload = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        roles: ['customer'],
        address: {
          province: formData.addressProvince,
          city: formData.addressCity,
          district: formData.addressDistrict,
          postalCode: formData.addressPostalCode, // Kirim Kode Pos
          detail: formData.addressDetail,
        },
      };

      await registerUser(payload);
      
      alert('Registrasi Berhasil! Silakan login.');
      router.push('/login'); 

    } catch (error: any) {
      console.error('Register Error:', error);
      const backendMsg = error.response?.data?.message;
      const validationDetails = error.response?.data?.errors?.[0]?.message;
      setErrorMsg(validationDetails || backendMsg || 'Gagal mendaftar. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row">
        
        {/* Visual Side */}
        <div className="hidden md:flex w-1/3 bg-red-600 relative p-8 text-white flex-col justify-between">
            <div className="relative z-10">
                <Link href="/" className="flex items-center gap-2 mb-8 font-bold text-2xl">Posko.</Link>
                <h2 className="text-3xl font-bold mb-4 leading-tight">Gabung Sekarang</h2>
                <p className="text-red-100 text-sm">Akses layanan jasa profesional dengan cepat dan aman.</p>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-full opacity-10">
                 <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                 </svg>
            </div>
        </div>

        {/* Form Side */}
        <div className="w-full md:w-2/3 p-8 sm:p-10">
            <div className="md:hidden mb-6">
               <Link href="/" className="text-2xl font-bold text-gray-900">Posko<span className="text-red-600">.</span></Link>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Buat Akun Baru</h2>
            
            {errorMsg && (
                <div className="mb-5 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg font-medium flex items-center gap-2">
                    <span className="text-lg">⚠️</span> {errorMsg}
                </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
                {/* Data Diri */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama Lengkap</label>
                        <input name="fullName" type="text" placeholder="Budi Santoso" value={formData.fullName} onChange={handleChange} required 
                            className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nomor HP / WA</label>
                        <input name="phoneNumber" type="tel" placeholder="08123456789" value={formData.phoneNumber} onChange={handleChange} required 
                            className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none text-sm" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email</label>
                    <input name="email" type="email" placeholder="nama@email.com" value={formData.email} onChange={handleChange} required 
                        className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none text-sm" />
                </div>

                {/* Alamat Dropdown Section */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-3">Alamat Domisili</p>
                    
                    {/* Provinsi & Kota */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                           <label className="text-[10px] text-gray-400 font-semibold">Provinsi</label>
                           <select 
                              className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none text-sm"
                              value={selectedProvId}
                              onChange={(e) => handleRegionChange('province', e)}
                              required
                           >
                              <option value="">Pilih Provinsi</option>
                              {provinces.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                           </select>
                        </div>
                        <div>
                           <label className="text-[10px] text-gray-400 font-semibold">Kota/Kab</label>
                           <select 
                              className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none text-sm disabled:bg-gray-100"
                              value={selectedCityId}
                              onChange={(e) => handleRegionChange('city', e)}
                              disabled={!selectedProvId}
                              required
                           >
                              <option value="">Pilih Kota</option>
                              {cities.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                           </select>
                        </div>
                    </div>

                    {/* Kecamatan & Kode Pos */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                           <label className="text-[10px] text-gray-400 font-semibold">Kecamatan</label>
                           <select 
                              className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none text-sm disabled:bg-gray-100"
                              value={selectedDistrictId}
                              onChange={(e) => handleRegionChange('district', e)}
                              disabled={!selectedCityId}
                              required
                           >
                              <option value="">Pilih Kecamatan</option>
                              {districts.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                              ))}
                           </select>
                        </div>
                        <div>
                           <label className="text-[10px] text-gray-400 font-semibold">Kode Pos</label>
                           <input 
                              name="addressPostalCode" 
                              type="text" 
                              placeholder="12345" 
                              value={formData.addressPostalCode} 
                              onChange={handleChange} 
                              className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none text-sm" 
                           />
                        </div>
                    </div>

                    <label className="text-[10px] text-gray-400 font-semibold">Detail Alamat (Jalan, No Rumah, RT/RW)</label>
                    <textarea name="addressDetail" rows={2} placeholder="Jl. Merdeka No. 10..." value={formData.addressDetail} onChange={handleChange} 
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none text-sm resize-none mt-1" required />
                </div>

                {/* Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
                        <input name="password" type="password" placeholder="******" value={formData.password} onChange={handleChange} required 
                            className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Konfirmasi</label>
                        <input name="confirmPassword" type="password" placeholder="******" value={formData.confirmPassword} onChange={handleChange} required 
                            className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none text-sm" />
                    </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-0">Min. 8 karakter, Huruf Besar, Kecil & Angka.</p>

                <div className="pt-2">
                    <button type="submit" disabled={isLoading} className="w-full bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 hover:-translate-y-0.5 transition-all disabled:bg-gray-300">
                        {isLoading ? 'Memproses...' : 'Daftar Akun'}
                    </button>
                </div>
            </form>

            <p className="mt-6 text-center text-xs text-gray-500">
                Sudah punya akun? <Link href="/login" className="font-bold text-red-600 hover:underline">Masuk disini</Link>
            </p>
        </div>
      </div>
    </div>
  );
}