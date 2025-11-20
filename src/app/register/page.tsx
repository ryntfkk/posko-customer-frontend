// src/app/register/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic'; // Penting untuk peta
import { registerUser } from '@/features/auth/api';
import { RegisterPayload } from '@/features/auth/types';

// Load Peta secara dynamic (Client Side Only) agar tidak error saat build
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-64 w-full bg-gray-200 animate-pulse rounded-lg flex items-center justify-center text-gray-500">Memuat Peta...</div>
});

interface Region {
  id: string;
  name: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Akun, 2: Data Diri, 3: Alamat
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // State Wilayah
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  
  const [selectedProvId, setSelectedProvId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');

  // Form State Lengkap
  const [formData, setFormData] = useState({
    // Step 1: Akun
    email: '',
    password: '',
    confirmPassword: '',
    // Step 2: Data Diri
    fullName: '',
    phoneNumber: '',
    birthDate: '',
    // Step 3: Alamat & Lokasi
    addressProvince: '',
    addressCity: '',
    addressDistrict: '',
    addressPostalCode: '',
    addressDetail: '',
    latitude: 0,
    longitude: 0,
  });

  // --- API WILAYAH (Sama seperti sebelumnya) ---
  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then((res) => res.json()).then(setProvinces).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedProvId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvId}.json`)
        .then((res) => res.json()).then(setCities).catch(console.error);
    }
  }, [selectedProvId]);

  useEffect(() => {
    if (selectedCityId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedCityId}.json`)
        .then((res) => res.json()).then(setDistricts).catch(console.error);
    }
  }, [selectedCityId]);


  // Handler Input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegionChange = (type: 'province' | 'city' | 'district', e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const index = e.target.selectedIndex;
    const text = e.target.options[index].text;

    if (type === 'province') {
      setSelectedProvId(id); setSelectedCityId(''); setSelectedDistrictId('');
      setFormData(prev => ({ ...prev, addressProvince: text, addressCity: '', addressDistrict: '' }));
    } else if (type === 'city') {
      setSelectedCityId(id); setSelectedDistrictId('');
      setFormData(prev => ({ ...prev, addressCity: text, addressDistrict: '' }));
    } else if (type === 'district') {
      setSelectedDistrictId(id);
      setFormData(prev => ({ ...prev, addressDistrict: text }));
    }
  };

  // Handler Lokasi dari Peta
  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
  };

  // Validasi Password
  const validatePasswordStrong = (pwd: string) => {
    return pwd.length >= 8 && /[a-z]/.test(pwd) && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd);
  };

  // Navigasi Step
  const nextStep = () => {
    setErrorMsg('');
    if (step === 1) {
        if (!formData.email || !formData.password || !formData.confirmPassword) return setErrorMsg('Semua field wajib diisi.');
        if (formData.password !== formData.confirmPassword) return setErrorMsg('Password tidak cocok.');
        if (!validatePasswordStrong(formData.password)) return setErrorMsg('Password harus kombinasi Huruf Besar, Kecil, Angka, min 8 karakter.');
    }
    if (step === 2) {
        if (!formData.fullName || !formData.phoneNumber || !formData.birthDate) return setErrorMsg('Lengkapi data diri Anda.');
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  // Submit Form
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const payload: RegisterPayload = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        birthDate: formData.birthDate, // YYYY-MM-DD format dari input type date sudah pas
        roles: ['customer'],
        address: {
          province: formData.addressProvince,
          city: formData.addressCity,
          district: formData.addressDistrict,
          postalCode: formData.addressPostalCode,
          detail: formData.addressDetail,
        },
        // Kirim format GeoJSON sesuai backend User.js: coordinates: [longitude, latitude]
        location: {
            type: 'Point',
            coordinates: [formData.longitude, formData.latitude] 
        }
      };

      await registerUser(payload);
      alert('Registrasi Berhasil! Silakan login.');
      router.push('/login'); 

    } catch (error: any) {
      console.error('Register Error:', error);
      const backendMsg = error.response?.data?.message;
      // Ambil pesan error validasi spesifik jika ada
      const validationDetails = error.response?.data?.errors?.[0]?.message;
      setErrorMsg(validationDetails || backendMsg || 'Gagal mendaftar. Cek koneksi atau data Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row">
        
        {/* Visual Side */}
        <div className="hidden md:flex w-1/3 bg-red-600 p-8 text-white flex-col justify-between relative">
             <div className="z-10">
                <Link href="/" className="text-2xl font-bold mb-8 block">Posko.</Link>
                <h2 className="text-3xl font-bold mb-4">Buat Akun</h2>
                <div className="space-y-4 mt-8">
                    {/* Stepper Indicator */}
                    <div className={`flex items-center gap-3 ${step >= 1 ? 'opacity-100' : 'opacity-50'}`}>
                        <div className="w-8 h-8 rounded-full bg-white text-red-600 flex items-center justify-center font-bold">1</div>
                        <span className="font-medium">Akun</span>
                    </div>
                    <div className={`flex items-center gap-3 ${step >= 2 ? 'opacity-100' : 'opacity-50'}`}>
                        <div className="w-8 h-8 rounded-full bg-white text-red-600 flex items-center justify-center font-bold">2</div>
                        <span className="font-medium">Data Diri</span>
                    </div>
                    <div className={`flex items-center gap-3 ${step >= 3 ? 'opacity-100' : 'opacity-50'}`}>
                        <div className="w-8 h-8 rounded-full bg-white text-red-600 flex items-center justify-center font-bold">3</div>
                        <span className="font-medium">Lokasi</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Form Side */}
        <div className="w-full md:w-2/3 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1 md:hidden">Daftar Baru</h2>
            <p className="text-gray-500 mb-6 text-sm">Langkah {step} dari 3</p>
            
            {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg font-medium">
                    ⚠️ {errorMsg}
                </div>
            )}

            <form onSubmit={handleRegister}>
                
                {/* --- LANGKAH 1: AKUN --- */}
                {step === 1 && (
                    <div className="space-y-4 animate-fade-in">
                        <div>
                            <label className="label-text">Email</label>
                            <input name="email" type="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="nama@email.com" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label-text">Password</label>
                                <input name="password" type="password" value={formData.password} onChange={handleChange} className="input-field" placeholder="******" />
                            </div>
                            <div>
                                <label className="label-text">Konfirmasi</label>
                                <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className="input-field" placeholder="******" />
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400">Min. 8 karakter, Huruf Besar, Kecil & Angka.</p>
                    </div>
                )}

                {/* --- LANGKAH 2: DATA DIRI --- */}
                {step === 2 && (
                    <div className="space-y-4 animate-fade-in">
                        <div>
                            <label className="label-text">Nama Lengkap</label>
                            <input name="fullName" type="text" value={formData.fullName} onChange={handleChange} className="input-field" placeholder="Budi Santoso" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label-text">Nomor HP</label>
                                <input name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} className="input-field" placeholder="08123..." />
                            </div>
                            <div>
                                <label className="label-text">Tanggal Lahir</label>
                                {/* Input Date HTML5 standard, format value otomatis YYYY-MM-DD */}
                                <input name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} className="input-field" />
                            </div>
                        </div>
                    </div>
                )}

                {/* --- LANGKAH 3: LOKASI --- */}
                {step === 3 && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label-text">Provinsi</label>
                                <select className="input-field" value={selectedProvId} onChange={(e) => handleRegionChange('province', e)}>
                                    <option value="">Pilih...</option>
                                    {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label-text">Kota/Kab</label>
                                <select className="input-field" value={selectedCityId} onChange={(e) => handleRegionChange('city', e)} disabled={!selectedProvId}>
                                    <option value="">Pilih...</option>
                                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label-text">Kecamatan</label>
                                <select className="input-field" value={selectedDistrictId} onChange={(e) => handleRegionChange('district', e)} disabled={!selectedCityId}>
                                    <option value="">Pilih...</option>
                                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label-text">Kode Pos</label>
                                <input name="addressPostalCode" type="text" value={formData.addressPostalCode} onChange={handleChange} className="input-field" placeholder="12345" />
                            </div>
                        </div>
                        <div>
                             <label className="label-text">Detail Alamat</label>
                             <textarea name="addressDetail" rows={2} value={formData.addressDetail} onChange={handleChange} className="input-field resize-none" placeholder="Jl. Mawar No. 5 RT/RW..." />
                        </div>
                        
                        {/* PETA */}
                        <div>
                            <label className="label-text mb-1 block">Titik Lokasi (Klik pada peta)</label>
                            <LocationPicker onLocationSelect={handleLocationSelect} />
                            {formData.latitude !== 0 && (
                                <p className="text-[10px] text-green-600 mt-1">
                                    Terpilih: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* NAVIGATION BUTTONS */}
                <div className="mt-8 flex gap-3">
                    {step > 1 && (
                        <button type="button" onClick={prevStep} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
                            Kembali
                        </button>
                    )}
                    
                    {step < 3 ? (
                        <button type="button" onClick={nextStep} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition">
                            Lanjut
                        </button>
                    ) : (
                        <button type="submit" disabled={isLoading} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition disabled:bg-gray-400">
                            {isLoading ? 'Memproses...' : 'Daftar Sekarang'}
                        </button>
                    )}
                </div>

            </form>

            <p className="mt-6 text-center text-xs text-gray-500">
                Sudah punya akun? <Link href="/login" className="font-bold text-red-600 hover:underline">Masuk disini</Link>
            </p>
        </div>
      </div>

      {/* Utility Style untuk Input (Optional: bisa taruh di globals.css) */}
      <style jsx>{`
        .label-text {
            @apply block text-[11px] font-bold text-gray-500 uppercase mb-1;
        }
        .input-field {
            @apply w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none text-sm transition-all;
        }
      `}</style>
    </div>
  );
}