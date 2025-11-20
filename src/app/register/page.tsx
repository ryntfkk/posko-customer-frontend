// src/app/register/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic'; 
import { registerUser } from '@/features/auth/api';
import { RegisterPayload } from '@/features/auth/types';

// Load Peta Dynamic
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-64 w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400 text-sm">Memuat Peta...</div>
});

interface Region {
  id: string;
  name: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // --- STATE VERIFIKASI DUMMY ---
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'verified'>('idle');
  const [phoneStatus, setPhoneStatus] = useState<'idle' | 'sending' | 'verified'>('idle');

  // State Wilayah
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [villages, setVillages] = useState<Region[]>([]);

  const [selectedProvId, setSelectedProvId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    // Step 1
    email: '',
    password: '',
    confirmPassword: '',
    // Step 2
    fullName: '',
    phoneNumber: '',
    birthDate: '',
    gender: '', // Ganti Bio dengan Gender
    // Step 3
    addressProvince: '',
    addressCity: '',
    addressDistrict: '',
    addressVillage: '', 
    addressPostalCode: '', 
    addressDetail: '',
    latitude: 0,
    longitude: 0,
  });

  // --- FETCH DATA WILAYAH ---
  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(res => res.json()).then(setProvinces).catch(console.error);
  }, []);

  const handleRegionChange = (type: 'province' | 'city' | 'district' | 'village', e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const index = e.target.selectedIndex;
    const text = index > 0 ? e.target.options[index].text : '';

    if (type === 'province') {
      setSelectedProvId(id); setSelectedCityId(''); setSelectedDistrictId(''); setSelectedVillageId('');
      setFormData(prev => ({ ...prev, addressProvince: text, addressCity: '', addressDistrict: '', addressVillage: '', addressPostalCode: '' }));
      if(id) fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${id}.json`).then(r => r.json()).then(setCities);
    } 
    else if (type === 'city') {
      setSelectedCityId(id); setSelectedDistrictId(''); setSelectedVillageId('');
      setFormData(prev => ({ ...prev, addressCity: text, addressDistrict: '', addressVillage: '', addressPostalCode: '' }));
      if(id) fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${id}.json`).then(r => r.json()).then(setDistricts);
    } 
    else if (type === 'district') {
      setSelectedDistrictId(id); setSelectedVillageId('');
      setFormData(prev => ({ ...prev, addressDistrict: text, addressVillage: '', addressPostalCode: '' }));
      if(id) fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${id}.json`).then(r => r.json()).then(setVillages);
    }
    else if (type === 'village') {
        setSelectedVillageId(id);
        const dummyPostalCode = id ? `1${id.substring(0, 4)}` : ''; 
        setFormData(prev => ({ ...prev, addressVillage: text, addressPostalCode: dummyPostalCode }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
  };

  // --- HANDLER DUMMY VERIFIKASI ---
  const handleVerifyEmail = () => {
    if (!formData.email.includes('@')) return alert('Masukkan email valid dulu');
    setEmailStatus('sending');
    setTimeout(() => setEmailStatus('verified'), 2000); 
  };

  const handleVerifyPhone = () => {
    if (formData.phoneNumber.length < 10) return alert('Masukkan nomor HP valid dulu');
    setPhoneStatus('sending');
    setTimeout(() => setPhoneStatus('verified'), 2000);
  };

  // --- VALIDASI ---
  const validateStep = () => {
    setErrorMsg('');
    if (step === 1) {
        if (!formData.email || !formData.password) return 'Email dan Password wajib diisi.';
        if (formData.password !== formData.confirmPassword) return 'Konfirmasi password tidak sesuai.';
        if (formData.password.length < 8) return 'Password minimal 8 karakter.';
    }
    if (step === 2) {
        if (!formData.fullName || !formData.phoneNumber || !formData.birthDate || !formData.gender) return 'Lengkapi semua data diri Anda.';
    }
    return '';
  };

  const nextStep = () => {
    const err = validateStep();
    if (err) return setErrorMsg(err);
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.latitude || !formData.longitude) return setErrorMsg('Silakan pilih titik lokasi pada peta.');
    if (!formData.addressVillage) return setErrorMsg('Mohon lengkapi alamat hingga Kelurahan.');

    setIsLoading(true);
    try {
        const payload: RegisterPayload = {
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password,
            phoneNumber: formData.phoneNumber,
            birthDate: formData.birthDate,
            gender: formData.gender, // Kirim Gender
            roles: ['customer'],
            address: {
                province: formData.addressProvince,
                district: formData.addressDistrict,
                city: formData.addressCity,
                village: formData.addressVillage,
                postalCode: formData.addressPostalCode,
                detail: formData.addressDetail
            },
            location: {
                type: 'Point',
                coordinates: [formData.longitude, formData.latitude]
            }
        };

        // NOTE: Pastikan backend sudah support field 'gender' dan 'village' di User Schema
        await registerUser(payload);
        alert('Registrasi Berhasil!');
        router.push('/login');
    } catch (err: any) {
        console.error(err);
        setErrorMsg(err.response?.data?.message || 'Gagal mendaftar. Coba lagi.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[650px]">
        
        {/* Sidebar / Visual Header */}
        <div className="bg-red-600 text-white p-8 md:w-1/3 flex flex-col justify-between relative overflow-hidden">
           <div className="absolute -top-20 -left-20 w-60 h-60 bg-red-500 rounded-full opacity-40 blur-3xl animate-pulse"></div>
           <div className="relative z-10">
                <Link href="/" className="text-3xl font-extrabold mb-2 block tracking-tight">Posko.</Link>
                <p className="text-red-100 text-sm font-medium opacity-90">Solusi bantuan darurat terpercaya.</p>
           </div>

           {/* Stepper */}
           <div className="mt-8 md:mt-0 py-6 md:py-0">
                <div className="flex md:flex-col gap-6 md:gap-8 justify-center md:justify-start">
                    {[1, 2, 3].map((num) => (
                        <div key={num} className={`flex items-center gap-4 transition-all duration-500 ${step === num ? 'opacity-100 translate-x-2' : 'opacity-50'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm
                                ${step === num ? 'bg-white text-red-600 scale-110 ring-4 ring-red-500/30' : 'bg-red-800 text-white border border-red-400/30'}`}>
                                {num}
                            </div>
                            <div className="hidden md:block">
                                <span className="block text-xs font-semibold uppercase tracking-wider text-red-200">Langkah {num}</span>
                                <span className="text-lg font-bold">
                                    {num === 1 ? 'Akun' : num === 2 ? 'Data Diri' : 'Lokasi'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
           </div>

           <div className="hidden md:block text-xs text-red-200 font-medium">
                &copy; 2025 Posko App Services.
           </div>
        </div>

        {/* Form Area */}
        <div className="flex-1 p-6 md:p-12 flex flex-col bg-white">
            <div className="flex-1">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">
                        {step === 1 && 'Buat Akun Baru'}
                        {step === 2 && 'Informasi Pribadi'}
                        {step === 3 && 'Alamat & Lokasi'}
                    </h2>
                    <p className="text-gray-500 text-sm mt-2">
                        {step === 1 && 'Mulai perjalananmu dengan mendaftarkan email.'}
                        {step === 2 && 'Beritahu kami identitas Anda yang sebenarnya.'}
                        {step === 3 && 'Tentukan lokasi agar kami bisa menemukanmu.'}
                    </p>
                </div>

                {errorMsg && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r shadow-sm mb-6 text-sm font-medium flex items-center gap-2 animate-pulse">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    
                    {/* --- STEP 1: AKUN --- */}
                    {step === 1 && (
                        <div className="space-y-6 animate-fadeIn">
                            {/* Group: Login Credentials */}
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <label className="label-text text-gray-600 mb-2">Email </label>
                                <div className="relative flex items-center">
                                    <input 
                                        type="email" 
                                        name="email" 
                                        value={formData.email} 
                                        onChange={handleChange} 
                                        placeholder="nama@email.com" 
                                        className={`input-field pr-28 ${emailStatus === 'verified' ? 'border-green-500 bg-green-50' : ''}`} 
                                        readOnly={emailStatus === 'verified'}
                                    />
                                    <div className="absolute right-1.5 top-1.5 bottom-1.5">
                                        {emailStatus === 'verified' ? (
                                            <span className="h-full px-3 flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 rounded-lg shadow-sm">
                                                ✓ Terverifikasi
                                            </span>
                                        ) : (
                                            <button 
                                                type="button" 
                                                onClick={handleVerifyEmail}
                                                disabled={emailStatus === 'sending' || !formData.email}
                                                className="h-full px-4 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 disabled:bg-gray-300 transition-colors shadow-sm"
                                            >
                                                {emailStatus === 'sending' ? 'Mengirim...' : 'Verifikasi'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {emailStatus === 'sending' && <p className="text-[10px] text-gray-500 mt-2 ml-1 flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span> Simulasi kirim kode OTP...</p>}
                            </div>

                            {/* Group: Security */}
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <label className="label-text text-gray-600 mb-4 ">Password</label>
                                <div className="flex flex-col gap-5">
                                    <div>
                                        <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Buat Kata Sandi" className="input-field" />
                                    </div>
                                    <div>
                                        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Ulangi Kata Sandi" className="input-field" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-start gap-2 bg-white p-3 rounded-lg border border-gray-100">
                                    <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <p className="text-xs text-gray-500 leading-snug">Gunakan minimal 8 karakter dengan kombinasi Huruf Besar, Kecil & Angka untuk keamanan maksimal.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- STEP 2: DATA DIRI --- */}
                    {step === 2 && (
                        <div className="space-y-6 animate-fadeIn">
                            
                            {/* Group: Identity */}
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col gap-6">
                                <div>
                                    <label className="label-text">Nama Lengkap  </label>
                                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Sesuai KTP" className="input-field" />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="label-text">Tanggal Lahir  </label>
                                        <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="input-field cursor-pointer" />
                                    </div>
                                    <div>
                                        <label className="label-text">Jenis Kelamin  </label>
                                        <select name="gender" value={formData.gender} onChange={handleChange} className="input-field cursor-pointer">
                                            <option value="">Pilih...</option>
                                            <option value="Laki-laki">Laki-laki</option>
                                            <option value="Perempuan">Perempuan</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Group: Contact */}
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <label className="label-text text-gray-600 mb-2">Number</label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-4 text-gray-500 text-sm font-bold bg-gray-100 px-1 rounded">+62</span>
                                    <input 
                                        type="tel" 
                                        name="phoneNumber" 
                                        value={formData.phoneNumber} 
                                        onChange={handleChange} 
                                        placeholder="8123456789" 
                                        className={`input-field pl-16 pr-28 ${phoneStatus === 'verified' ? 'border-green-500 bg-green-50' : ''}`} 
                                        readOnly={phoneStatus === 'verified'}
                                    />
                                    <div className="absolute right-1.5 top-1.5 bottom-1.5">
                                        {phoneStatus === 'verified' ? (
                                            <span className="h-full px-3 flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 rounded-lg shadow-sm">
                                                ✓ OK
                                            </span>
                                        ) : (
                                            <button 
                                                type="button" 
                                                onClick={handleVerifyPhone}
                                                disabled={phoneStatus === 'sending' || !formData.phoneNumber}
                                                className="h-full px-4 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 disabled:bg-gray-300 transition-colors shadow-sm"
                                            >
                                                {phoneStatus === 'sending' ? 'OTP...' : 'Verifikasi'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {phoneStatus === 'sending' && <p className="text-[10px] text-gray-500 mt-2 ml-1 flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span> Mengirim kode OTP ke WhatsApp...</p>}
                            </div>
                        </div>
                    )}

                    {/* --- STEP 3: LOKASI --- */}
                    {step === 3 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn h-full">
                            {/* Kolom Kiri: Form Wilayah */}
                            <div className="space-y-6">
                                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-5">
                                    <div className="grid grid-cols-2 gap-5">
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
                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="label-text">Kecamatan</label>
                                            <select className="input-field" value={selectedDistrictId} onChange={(e) => handleRegionChange('district', e)} disabled={!selectedCityId}>
                                                <option value="">Pilih...</option>
                                                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label-text">Kelurahan</label>
                                            <select className="input-field" value={selectedVillageId} onChange={(e) => handleRegionChange('village', e)} disabled={!selectedDistrictId}>
                                                <option value="">Pilih...</option>
                                                {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label-text">Kode Pos (Otomatis)</label>
                                        <input 
                                            type="text" 
                                            name="addressPostalCode" 
                                            value={formData.addressPostalCode} 
                                            readOnly 
                                            className="input-field bg-gray-200 text-gray-600 font-semibold cursor-not-allowed border-transparent" 
                                            placeholder="-"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                     <label className="label-text ml-1">Detail Alamat</label>
                                     <textarea name="addressDetail" rows={3} value={formData.addressDetail} onChange={handleChange} className="input-field resize-none py-3 leading-relaxed" placeholder="Nama Jalan, Nomor Rumah, RT/RW, Patokan..." />
                                </div>
                            </div>

                            {/* Kolom Kanan: Peta */}
                            <div className="flex flex-col h-full min-h-[400px] bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-3 px-2">Pin Lokasi Rumah</label>
                                <div className="flex-1 rounded-xl overflow-hidden shadow-sm relative border border-gray-200">
                                    <LocationPicker onLocationSelect={handleLocationSelect} />
                                </div>
                                <div className="mt-4 px-2 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Koordinat Terpilih</span>
                                    {formData.latitude !== 0 ? (
                                        <span className="text-xs font-mono bg-green-100 text-green-700 px-3 py-1.5 rounded-lg border border-green-200 font-semibold">
                                            {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-red-400 italic bg-red-50 px-3 py-1.5 rounded-lg">Belum dipilih</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* Tombol Navigasi */}
            <div className="mt-10 pt-6 border-t border-gray-100 flex items-center gap-4">
                {step > 1 && (
                    <button onClick={prevStep} className="px-6 py-3.5 rounded-xl bg-white border-2 border-gray-100 text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-200 transition-all">
                        Kembali
                    </button>
                )}
                <div className="flex-1"></div>
                
                {/* Indikator Dots untuk Mobile */}
                <div className="flex gap-2 md:hidden mr-4">
                    {[1, 2, 3].map(num => (
                        <div key={num} className={`w-2 h-2 rounded-full transition-colors duration-300 ${step === num ? 'bg-red-600 scale-125' : 'bg-gray-200'}`} />
                    ))}
                </div>

                {step < 3 ? (
                    <button onClick={nextStep} className="px-10 py-3.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-200 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                        Lanjut <span className="text-xl">→</span>
                    </button>
                ) : (
                    <button onClick={handleSubmit} disabled={isLoading} className="px-10 py-3.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-black shadow-lg hover:-translate-y-0.5 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2">
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Memproses...
                            </>
                        ) : 'Daftar Sekarang'}
                    </button>
                )}
            </div>
            
            <p className="text-center mt-6 text-xs text-gray-400">
                Sudah punya akun? <Link href="/login" className="text-red-600 font-bold hover:underline ml-1">Masuk</Link>
            </p>
        </div>
      </div>

      <style jsx>{`
        .label-text {
            @apply block text-[11px] font-bold text-gray-500 uppercase mb-2 tracking-wider;
        }
        .input-field {
            @apply w-full h-[52px] px-4 rounded-xl bg-white border-2 border-gray-100 text-gray-800 text-sm focus:border-red-500 focus:ring-0 outline-none transition-all placeholder-gray-300 font-medium;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
            animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}