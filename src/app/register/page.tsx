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
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400 text-xs">Memuat Peta...</div>
});

interface Region { id: string; name: string; }

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Dummy Status
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'verified'>('idle');
  const [phoneStatus, setPhoneStatus] = useState<'idle' | 'sending' | 'verified'>('idle');

  // Wilayah
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
    email: '', password: '', confirmPassword: '',
    fullName: '', phoneNumber: '', birthDate: '', gender: '',
    addressProvince: '', addressCity: '', addressDistrict: '',
    addressVillage: '', addressPostalCode: '', addressDetail: '',
    latitude: 0, longitude: 0,
  });

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-0 lg:p-8 font-sans text-gray-800">
        
        {/* Container Utama */}
        <div className="bg-white w-full max-w-5xl lg:rounded-3xl lg:shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-screen lg:min-h-[600px]">
            
            {/* SIDEBAR (Hanya Desktop) */}
            <div className="hidden lg:flex bg-red-600 text-white p-10 w-1/3 flex-col justify-between relative overflow-hidden">
                 <div className="absolute -top-20 -left-20 w-60 h-60 bg-red-500 rounded-full opacity-40 blur-3xl"></div>
                 <div className="relative z-10">
                    <Link href="/" className="text-3xl font-extrabold tracking-tight">Posko.</Link>
                    <p className="text-red-100 mt-2 opacity-90">Solusi bantuan darurat.</p>
                 </div>
                 <div className="space-y-6 relative z-10">
                    {[1, 2, 3].map((num) => (
                        <div key={num} className={`flex items-center gap-4 transition-all ${step === num ? 'opacity-100 translate-x-2' : 'opacity-50'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${step === num ? 'bg-white text-red-600 border-white' : 'border-red-400'}`}>{num}</div>
                            <div>
                                <span className="text-xs uppercase font-bold text-red-200">Langkah {num}</span>
                                <p className="font-bold">{num===1?'Akun':num===2?'Data Diri':'Lokasi'}</p>
                            </div>
                        </div>
                    ))}
                 </div>
                 <div className="text-xs text-red-200">© 2024 Posko App</div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col h-full">
                
                {/* Mobile Header */}
                <div className="lg:hidden bg-white px-6 pt-6 pb-2 sticky top-0 z-20 border-b border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <Link href="/" className="text-xl font-extrabold text-red-600">Posko.</Link>
                        <span className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-600">Langkah {step}/3</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-red-600 h-full transition-all duration-300" style={{ width: `${(step/3)*100}%` }}></div>
                    </div>
                </div>

                {/* Form Area */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-12">
                    <div className="max-w-xl mx-auto">
                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                            {step === 1 && 'Buat Akun'}
                            {step === 2 && 'Siapa Anda?'}
                            {step === 3 && 'Dimana Rumahmu?'}
                        </h2>
                        <p className="text-gray-500 text-sm mb-6">Lengkapi data untuk melanjutkan.</p>

                        {/* --- LOGIKA FORM LANGSUNG DI SINI (FIX BUG) --- */}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            
                            {errorMsg && (
                                <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r font-medium animate-pulse">
                                    {errorMsg}
                                </div>
                            )}

                            {step === 1 && (
                                <div className="space-y-4 animate-fadeIn">
                                    <div>
                                        <label className="label-text">Email</label>
                                        <div className="flex gap-2">
                                            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="nama@email.com" className="input-field flex-1" readOnly={emailStatus === 'verified'}/>
                                            <button type="button" onClick={handleVerifyEmail} disabled={emailStatus !== 'idle' || !formData.email} className="px-3 bg-gray-900 text-white rounded-xl text-xs font-bold disabled:bg-gray-300">
                                                {emailStatus === 'verified' ? '✓' : emailStatus === 'sending' ? '...' : 'Cek'}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label-text">Password</label>
                                        <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field mb-3" placeholder="Minimal 8 karakter"/>
                                        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="input-field" placeholder="Ulangi password"/>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4 animate-fadeIn">
                                    <div>
                                        <label className="label-text">Nama Lengkap</label>
                                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="input-field" placeholder="Sesuai KTP"/>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="label-text">Tgl Lahir</label>
                                            <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="input-field"/>
                                        </div>
                                        <div>
                                            <label className="label-text">Gender</label>
                                            <select name="gender" value={formData.gender} onChange={handleChange} className="input-field">
                                                <option value="">Pilih</option>
                                                <option value="Laki-laki">Laki-laki</option>
                                                <option value="Perempuan">Perempuan</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label-text">WhatsApp</label>
                                        <div className="flex gap-2">
                                             <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="input-field flex-1" placeholder="0812..."/>
                                             <button type="button" onClick={handleVerifyPhone} disabled={phoneStatus !== 'idle' || !formData.phoneNumber} className="px-3 bg-gray-900 text-white rounded-xl text-xs font-bold disabled:bg-gray-300">
                                                {phoneStatus === 'verified' ? '✓' : phoneStatus === 'sending' ? '...' : 'OTP'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-4 animate-fadeIn">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                             <div className="grid grid-cols-2 gap-3">
                                                <select className="input-field" value={selectedProvId} onChange={(e) => handleRegionChange('province', e)}><option value="">Provinsi</option>{provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                                                <select className="input-field" value={selectedCityId} onChange={(e) => handleRegionChange('city', e)} disabled={!selectedProvId}><option value="">Kota</option>{cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                                             </div>
                                             <div className="grid grid-cols-2 gap-3">
                                                <select className="input-field" value={selectedDistrictId} onChange={(e) => handleRegionChange('district', e)} disabled={!selectedCityId}><option value="">Kecamatan</option>{districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
                                                <select className="input-field" value={selectedVillageId} onChange={(e) => handleRegionChange('village', e)} disabled={!selectedDistrictId}><option value="">Kelurahan</option>{villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
                                             </div>
                                             <textarea name="addressDetail" rows={2} value={formData.addressDetail} onChange={handleChange} className="input-field py-2 resize-none" placeholder="Nama Jalan, No Rumah..."></textarea>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="label-text">Tandai Lokasi</label>
                                            <div className="h-48 lg:h-full min-h-[180px] rounded-xl overflow-hidden border-2 border-gray-200 relative z-0">
                                                <LocationPicker onLocationSelect={handleLocationSelect} />
                                            </div>
                                            {formData.latitude !== 0 && <p className="text-[10px] text-green-600 font-bold text-right">Lokasi Terpilih ✓</p>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>

                {/* Bottom Navigation */}
                <div className="p-6 lg:px-12 border-t border-gray-100 bg-white sticky bottom-0 z-20">
                    <div className="max-w-xl mx-auto flex gap-4">
                        {step > 1 && (
                            <button type="button" onClick={prevStep} className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50">
                                Kembali
                            </button>
                        )}
                        <button 
                            type="button" 
                            onClick={step < 3 ? nextStep : handleSubmit} 
                            disabled={isLoading}
                            className={`flex-[2] py-3.5 rounded-xl text-white font-bold shadow-lg transition-all hover:-translate-y-0.5
                                ${step < 3 ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-gray-900 hover:bg-black shadow-gray-300'} 
                                disabled:bg-gray-300 disabled:cursor-not-allowed`}
                        >
                            {isLoading ? 'Memproses...' : step < 3 ? 'Lanjut →' : 'Daftar Sekarang'}
                        </button>
                    </div>
                    <div className="text-center mt-4 lg:hidden">
                        <Link href="/login" className="text-xs text-gray-500">Sudah punya akun? <span className="font-bold text-red-600">Masuk</span></Link>
                    </div>
                </div>
            </div>
        </div>

        <style jsx>{`
            .label-text { @apply block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider; }
            .input-field { @apply w-full h-[46px] px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all placeholder-gray-400; }
            .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
    </div>
  );
}