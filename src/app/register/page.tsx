// src/app/register/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic'; 
import { registerUser } from '@/features/auth/api';
import { RegisterPayload } from '@/features/auth/types';

// Load Peta Dynamic (No SSR)
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 animate-pulse rounded-xl flex flex-col gap-2 items-center justify-center text-gray-400 text-xs">
       <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
       <span>Memuat Peta...</span>
    </div>
  )
});

interface Region { id: string; name: string; }

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Dummy Status Verifikasi
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'verified'>('idle');
  const [phoneStatus, setPhoneStatus] = useState<'idle' | 'sending' | 'verified'>('idle');

  // Data Wilayah
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [villages, setVillages] = useState<Region[]>([]);
  
  const [selectedProvId, setSelectedProvId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState('');

  // Form Data State
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    fullName: '', phoneNumber: '', birthDate: '', gender: '',
    addressProvince: '', addressCity: '', addressDistrict: '',
    addressVillage: '', addressPostalCode: '', addressDetail: '',
    latitude: 0, longitude: 0,
  });

  // Fetch Provinsi saat mount
  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(res => res.json()).then(setProvinces).catch(console.error);
  }, []);

  // Handler Wilayah (Cascading Dropdown)
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

  // Dummy Actions
  const handleVerifyEmail = () => {
    if (!formData.email.includes('@')) return alert('Masukkan email valid');
    setEmailStatus('sending');
    setTimeout(() => setEmailStatus('verified'), 1500); 
  };

  const handleVerifyPhone = () => {
    if (formData.phoneNumber.length < 10) return alert('Nomor HP minimal 10 digit');
    setPhoneStatus('sending');
    setTimeout(() => setPhoneStatus('verified'), 1500);
  };

  // Validasi Sederhana
  const validateStep = () => {
    setErrorMsg('');
    if (step === 1) {
        if (!formData.email || !formData.password) return 'Email dan Password wajib diisi.';
        if (formData.password !== formData.confirmPassword) return 'Konfirmasi password tidak sesuai.';
        if (formData.password.length < 8) return 'Password minimal 8 karakter.';
    }
    if (step === 2) {
        if (!formData.fullName || !formData.phoneNumber || !formData.birthDate || !formData.gender) return 'Lengkapi data diri.';
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
    if (!formData.latitude || !formData.longitude) return setErrorMsg('Pilih lokasi pada peta.');
    if (!formData.addressVillage) return setErrorMsg('Lengkapi alamat wilayah.');

    setIsLoading(true);
    try {
        const payload: RegisterPayload = {
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password,
            phoneNumber: formData.phoneNumber,
            birthDate: formData.birthDate,
            gender: formData.gender,
            roles: ['customer'],
            address: {
                province: formData.addressProvince,
                district: formData.addressDistrict,
                city: formData.addressCity,
                village: formData.addressVillage,
                postalCode: formData.addressPostalCode,
                detail: formData.addressDetail
            },
            location: { type: 'Point', coordinates: [formData.longitude, formData.latitude] }
        };
        await registerUser(payload);
        router.push('/login');
    } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Gagal mendaftar.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] lg:min-h-screen bg-white lg:bg-gray-100 flex items-center justify-center p-0 lg:p-6 font-sans text-gray-800">
        
        {/* Container Utama: Full Screen di Mobile, Card Centered di Desktop */}
        <div className="bg-white w-full max-w-6xl lg:rounded-3xl lg:shadow-2xl overflow-hidden flex flex-col lg:flex-row h-[100dvh] lg:h-auto lg:min-h-[650px]">
            
            {/* === SIDEBAR (Hanya Desktop) === */}
            <div className="hidden lg:flex bg-red-600 text-white p-12 w-1/3 flex-col justify-between relative overflow-hidden">
                 {/* Dekorasi Background */}
                 <div className="absolute -top-24 -left-24 w-80 h-80 bg-red-500 rounded-full opacity-50 blur-3xl"></div>
                 <div className="absolute bottom-0 right-0 w-64 h-64 bg-red-700 rounded-full opacity-30 blur-2xl translate-y-1/2 translate-x-1/4"></div>
                 
                 <div className="relative z-10">
                    <Link href="/" className="text-3xl font-black tracking-tighter flex items-center gap-1">
                        Posko<span className="w-2 h-2 bg-white rounded-full mt-3"></span>
                    </Link>
                    <p className="text-red-100 mt-4 text-lg leading-relaxed opacity-90 font-medium">
                        Bergabung bersama ribuan pengguna lainnya.
                    </p>
                 </div>

                 {/* Indikator Step Desktop */}
                 <div className="space-y-8 relative z-10">
                    {[1, 2, 3].map((num) => (
                        <div key={num} className={`flex items-center gap-4 transition-all duration-500 ${step === num ? 'opacity-100 translate-x-0' : 'opacity-40 translate-x-0'}`}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border-2 transition-colors duration-300 ${step === num ? 'bg-white text-red-600 border-white shadow-lg' : 'border-red-400 text-red-100'}`}>
                                {num}
                            </div>
                            <div>
                                <span className="text-xs uppercase font-bold tracking-widest text-red-200 block mb-0.5">Langkah {num}</span>
                                <p className="font-bold text-lg">{num===1 ? 'Akun' : num===2 ? 'Data Diri' : 'Lokasi'}</p>
                            </div>
                        </div>
                    ))}
                 </div>

                 <div className="relative z-10 text-sm font-medium text-red-200/80">
                    © 2024 Posko App Services
                 </div>
            </div>

            {/* === MAIN CONTENT === */}
            <div className="flex-1 flex flex-col h-full relative">
                
                {/* Header Mobile (Sticky Top) */}
                <div className="lg:hidden bg-white px-6 pt-6 pb-4 sticky top-0 z-30 border-b border-gray-100/80 backdrop-blur-md bg-white/90">
                    <div className="flex justify-between items-center mb-4">
                        <Link href="/" className="text-xl font-black text-gray-900">Posko<span className="text-red-600">.</span></Link>
                        <span className="text-[10px] font-bold bg-gray-100 px-3 py-1.5 rounded-full text-gray-500 uppercase tracking-wide">
                            Step {step} of 3
                        </span>
                    </div>
                    {/* Progress Bar Mobile */}
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                            className="bg-red-600 h-full transition-all duration-500 ease-out rounded-full" 
                            style={{ width: `${(step/3)*100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Scrollable Form Area */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-12 scroll-smooth">
                    <div className="max-w-xl mx-auto lg:mt-4">
                        
                        {/* Judul Halaman */}
                        <div className="mb-8">
                            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                                {step === 1 && 'Buat Akun Baru'}
                                {step === 2 && 'Informasi Pribadi'}
                                {step === 3 && 'Alamat & Lokasi'}
                            </h2>
                            <p className="text-gray-500 text-sm lg:text-base">
                                {step === 1 && 'Mulai perjalananmu bersama kami.'}
                                {step === 2 && 'Kami perlu mengenalmu lebih dekat.'}
                                {step === 3 && 'Agar teknisi dapat menemukanmu.'}
                            </p>
                        </div>

                        {/* Error Alert */}
                        {errorMsg && (
                            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-xl font-medium animate-pulse flex items-center gap-3">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            
                            {/* STEP 1: AKUN */}
                            {step === 1 && (
                                <div className="space-y-5 animate-fadeIn">
                                    <div>
                                        <label className="label-text">Email Address</label>
                                        <div className="relative">
                                            <input 
                                                type="email" name="email" value={formData.email} onChange={handleChange} 
                                                placeholder="nama@email.com" 
                                                className="input-field pr-20" 
                                                readOnly={emailStatus === 'verified'}
                                            />
                                            <button 
                                                type="button" 
                                                onClick={handleVerifyEmail} 
                                                disabled={emailStatus !== 'idle' || !formData.email}
                                                className="absolute right-2 top-2 bottom-2 px-4 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                                            >
                                                {emailStatus === 'verified' ? '✓ OK' : emailStatus === 'sending' ? '...' : 'Cek'}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label-text">Password</label>
                                        <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field mb-3" placeholder="Minimal 8 karakter"/>
                                    </div>
                                    <div>
                                        <label className="label-text">Konfirmasi Password</label>
                                        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="input-field" placeholder="Ulangi password"/>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: DATA DIRI */}
                            {step === 2 && (
                                <div className="space-y-5 animate-fadeIn">
                                    <div>
                                        <label className="label-text">Nama Lengkap</label>
                                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="input-field" placeholder="Sesuai KTP"/>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label-text">Tgl Lahir</label>
                                            <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="input-field text-gray-600"/>
                                        </div>
                                        <div>
                                            <label className="label-text">Gender</label>
                                            <select name="gender" value={formData.gender} onChange={handleChange} className="input-field text-gray-700 bg-white">
                                                <option value="">Pilih</option>
                                                <option value="Laki-laki">Laki-laki</option>
                                                <option value="Perempuan">Perempuan</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label-text">Nomor WhatsApp</label>
                                        <div className="relative">
                                             <span className="absolute left-4 top-3.5 text-gray-500 font-medium text-sm">+62</span>
                                             <input 
                                                type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} 
                                                className="input-field pl-12 pr-20" 
                                                placeholder="812 3456 7890"
                                             />
                                             <button 
                                                type="button" 
                                                onClick={handleVerifyPhone} 
                                                disabled={phoneStatus !== 'idle' || !formData.phoneNumber} 
                                                className="absolute right-2 top-2 bottom-2 px-4 bg-gray-900 text-white rounded-lg text-xs font-bold disabled:bg-gray-200 disabled:text-gray-400"
                                            >
                                                {phoneStatus === 'verified' ? '✓ OK' : phoneStatus === 'sending' ? '...' : 'Kirim OTP'}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1.5 ml-1">*Kode verifikasi akan dikirim via WhatsApp</p>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: LOKASI */}
                            {step === 3 && (
                                <div className="animate-fadeIn flex flex-col gap-6 h-full">
                                    {/* Layout Grid: Desktop (2 Kolom), Mobile (1 Kolom) */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 h-full">
                                        
                                        {/* Kolom Kiri: Form Alamat */}
                                        <div className="lg:col-span-5 space-y-4 order-2 lg:order-1">
                                             <div className="space-y-3">
                                                <label className="label-text border-b pb-2 block">Detail Wilayah</label>
                                                <select className="input-field bg-white" value={selectedProvId} onChange={(e) => handleRegionChange('province', e)}>
                                                    <option value="">Pilih Provinsi</option>
                                                    {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                                
                                                <select className="input-field bg-white" value={selectedCityId} onChange={(e) => handleRegionChange('city', e)} disabled={!selectedProvId}>
                                                    <option value="">Pilih Kota/Kab</option>
                                                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <select className="input-field bg-white" value={selectedDistrictId} onChange={(e) => handleRegionChange('district', e)} disabled={!selectedCityId}>
                                                        <option value="">Kecamatan</option>
                                                        {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                    </select>
                                                    <select className="input-field bg-white" value={selectedVillageId} onChange={(e) => handleRegionChange('village', e)} disabled={!selectedDistrictId}>
                                                        <option value="">Kelurahan</option>
                                                        {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                                    </select>
                                                </div>
                                             </div>

                                             <div>
                                                <label className="label-text">Alamat Lengkap</label>
                                                <textarea 
                                                    name="addressDetail" rows={3} value={formData.addressDetail} onChange={handleChange} 
                                                    className="input-field py-3 h-auto resize-none leading-relaxed" 
                                                    placeholder="Nama Jalan, Nomor Rumah, RT/RW, Patokan..."
                                                ></textarea>
                                             </div>
                                        </div>

                                        {/* Kolom Kanan: Peta */}
                                        <div className="lg:col-span-7 order-1 lg:order-2 flex flex-col">
                                            <label className="label-text mb-2 flex justify-between items-center">
                                                <span>Tandai Lokasi Rumah</span>
                                                {formData.latitude !== 0 && <span className="text-green-600 text-[10px] font-bold bg-green-50 px-2 py-0.5 rounded">✓ Terpilih</span>}
                                            </label>
                                            {/* Map Container Fixed Height on Desktop, Aspect Ratio on Mobile */}
                                            <div className="w-full h-56 lg:h-[320px] rounded-2xl overflow-hidden border-2 border-gray-200 shadow-sm relative z-0 group">
                                                <LocationPicker onLocationSelect={handleLocationSelect} />
                                                {/* Hint Overlay */}
                                                {formData.latitude === 0 && (
                                                    <div className="absolute inset-0 bg-black/5 pointer-events-none flex items-center justify-center group-hover:bg-transparent transition-colors">
                                                        <span className="bg-white/90 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm text-gray-600">Klik peta untuk set pin</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>

                {/* Footer Navigasi (Sticky Bottom) */}
                <div className="p-6 lg:px-12 lg:py-8 border-t border-gray-100 bg-white z-20">
                    <div className="max-w-xl mx-auto flex gap-4">
                        {step > 1 && (
                            <button 
                                type="button" 
                                onClick={prevStep} 
                                className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all active:scale-95"
                            >
                                Kembali
                            </button>
                        )}
                        <button 
                            type="button" 
                            onClick={step < 3 ? nextStep : handleSubmit} 
                            disabled={isLoading}
                            className={`flex-[2] py-3.5 rounded-xl text-white font-bold shadow-lg shadow-red-100 transition-all hover:-translate-y-0.5 active:scale-95
                                ${step < 3 ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-black'} 
                                disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none`}
                        >
                            {isLoading ? 'Memproses...' : step < 3 ? 'Lanjut Langkah Berikutnya' : 'Daftar Sekarang'}
                        </button>
                    </div>
                    
                    <div className="text-center mt-6 lg:hidden pb-2">
                        <Link href="/login" className="text-xs text-gray-500 font-medium p-2">
                            Sudah punya akun? <span className="font-bold text-red-600 underline underline-offset-2">Masuk disini</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>

        <style jsx>{`
            .label-text { @apply block text-[11px] font-bold text-gray-500 uppercase mb-2 tracking-wide; }
            .input-field { @apply w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder-gray-400 hover:border-gray-300; }
            .animate-fadeIn { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
    </div>
  );
}