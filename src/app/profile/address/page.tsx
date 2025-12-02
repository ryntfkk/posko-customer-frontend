// src/app/profile/address/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { fetchProfile, updateProfile } from '@/features/auth/api';
import { User, Address } from '@/features/auth/types';

// Load Component Map secara Dynamic (Client Side Only) untuk menghindari error SSR
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-50 animate-pulse rounded-xl flex flex-col items-center justify-center text-gray-400 gap-2 border border-gray-200">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
      <span className="text-[10px] font-medium">Memuat Peta...</span>
    </div>
  )
});

interface Region { 
  id: string; 
  name: string; 
}

export default function AddressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // State Data Wilayah untuk Dropdown
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [villages, setVillages] = useState<Region[]>([]);

  // State ID Wilayah yang dipilih (untuk fetch API wilayah berjenjang)
  const [selectedProvId, setSelectedProvId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState('');

  // State Form Data
  const [formData, setFormData] = useState<Address>({
    province: '',
    city: '',
    district: '',
    village: '',
    postalCode: '',
    detail: ''
  });

  // State Koordinat
  const [coordinates, setCoordinates] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null
  });

  // 1. Load Data User & Provinsi saat pertama kali buka
  useEffect(() => {
    const initData = async () => {
      try {
        // Fetch Provinces
        const provRes = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
        const provData = await provRes.json();
        setProvinces(provData);

        // Fetch User Profile
        const profileRes = await fetchProfile();
        const user = profileRes.data.profile;

        if (user) {
          // Set Alamat Text
          if (user.address) {
            setFormData({
              province: user.address.province || '',
              city: user.address.city || '',
              district: user.address.district || '',
              village: user.address.village || '',
              postalCode: user.address.postalCode || '',
              detail: user.address.detail || ''
            });
          }

          // Set Koordinat (GeoJSON: [long, lat])
          if (user.location && user.location.coordinates) {
            setCoordinates({
              lng: user.location.coordinates[0],
              lat: user.location.coordinates[1]
            });
          }
        }
      } catch (error) {
        console.error("Gagal memuat data:", error);
        // Opsi: router.push('/login'); jika auth error
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [router]);

  // 2. Handler Perubahan Dropdown Wilayah
  const handleRegionChange = (type: 'province' | 'city' | 'district' | 'village', e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const index = e.target.selectedIndex;
    const text = index > 0 ? e.target.options[index].text : '';

    if (type === 'province') {
      setSelectedProvId(id); 
      setSelectedCityId(''); setSelectedDistrictId(''); setSelectedVillageId('');
      setCities([]); setDistricts([]); setVillages([]);
      
      setFormData(prev => ({ 
        ...prev, 
        province: text, city: '', district: '', village: '', postalCode: '' 
      }));

      if(id) {
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${id}.json`)
          .then(r => r.json()).then(setCities).catch(console.error);
      }
    } 
    else if (type === 'city') {
      setSelectedCityId(id); 
      setSelectedDistrictId(''); setSelectedVillageId('');
      setDistricts([]); setVillages([]);
      
      setFormData(prev => ({ 
        ...prev, 
        city: text, district: '', village: '', postalCode: '' 
      }));

      if(id) {
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${id}.json`)
          .then(r => r.json()).then(setDistricts).catch(console.error);
      }
    } 
    else if (type === 'district') {
      setSelectedDistrictId(id); 
      setSelectedVillageId('');
      setVillages([]);
      
      setFormData(prev => ({ 
        ...prev, 
        district: text, village: '', postalCode: '' 
      }));

      if(id) {
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${id}.json`)
          .then(r => r.json()).then(setVillages).catch(console.error);
      }
    }
    else if (type === 'village') {
      setSelectedVillageId(id);
      // Auto-fill Kode Pos (Logika dummy sederhana, bisa disesuaikan jika API menyediakan kodepos)
      const dummyPostalCode = id ? `5${id.substring(0, 4)}` : ''; 
      
      setFormData(prev => ({ 
        ...prev, 
        village: text, 
        postalCode: dummyPostalCode 
      }));
    }
  };

  // 3. Handler Input Text Biasa (Detail Alamat & Kode Pos Manual)
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 4. Handler Lokasi dari Peta
  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setCoordinates({ lat, lng });
  }, []);

  // 5. Handler Get Current Location (GPS)
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser tidak mendukung Geolocation.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      (err) => {
        console.error(err);
        alert("Gagal mengambil lokasi. Pastikan GPS aktif.");
      },
      { enableHighAccuracy: true }
    );
  };

  // 6. Submit Data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Validasi sederhana
      if (!formData.province || !formData.city || !formData.detail) {
        alert("Mohon lengkapi alamat wilayah dan detail jalan.");
        setIsSaving(false);
        return;
      }

      if (!coordinates.lat || !coordinates.lng) {
        alert("Mohon tentukan titik lokasi di peta.");
        setIsSaving(false);
        return;
      }

      // Payload Update
      const payload = {
        address: formData,
        location: {
          type: 'Point',
          coordinates: [coordinates.lng, coordinates.lat] // GeoJSON format: [long, lat]
        }
      };

      await updateProfile(payload);
      alert("Alamat berhasil diperbarui!");
      router.push('/profile');
      
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan perubahan alamat.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      {/* Header Mobile Style */}
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-20 flex items-center gap-3">
        <Link href="/profile" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
        </Link>
        <h1 className="text-base font-bold text-gray-900">Ubah Alamat</h1>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-5">
        
        {/* SECTION 1: MAPS */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-sm font-bold text-gray-900">Titik Lokasi</h2>
                    <p className="text-[10px] text-gray-500">Geser pin untuk akurasi lokasi</p>
                </div>
                {coordinates.lat && (
                    <span className="text-[9px] bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 font-medium">
                        Koordinat Terpilih
                    </span>
                )}
            </div>

            <div className="w-full h-56 rounded-xl overflow-hidden border border-gray-200 relative z-0">
                <LocationPicker 
                    onLocationSelect={handleLocationSelect}
                    initialLat={coordinates.lat || -6.200000}
                    initialLng={coordinates.lng || 106.816666}
                />
            </div>

            <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="w-full py-2.5 rounded-xl border border-dashed border-gray-300 text-gray-600 text-xs font-bold hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Gunakan Lokasi Saya Saat Ini
            </button>
        </div>

        {/* SECTION 2: FORM */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            
            <div>
                <h2 className="text-sm font-bold text-gray-900 mb-3">Detail Alamat</h2>
                
                {/* Provinsi */}
                <div className="mb-3">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Provinsi</label>
                    <div className="relative">
                        <select 
                            className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none appearance-none transition-all"
                            value={selectedProvId}
                            onChange={(e) => handleRegionChange('province', e)}
                        >
                            <option value="">{formData.province || "Pilih Provinsi"}</option>
                            {provinces.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>

                {/* Kota */}
                <div className="mb-3">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Kota / Kabupaten</label>
                    <div className="relative">
                        <select 
                            className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none appearance-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
                            value={selectedCityId}
                            onChange={(e) => handleRegionChange('city', e)}
                            disabled={!selectedProvId && !formData.province}
                        >
                            <option value="">{formData.city || "Pilih Kota"}</option>
                            {cities.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>

                {/* Grid Kecamatan & Kelurahan */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Kecamatan</label>
                        <div className="relative">
                            <select 
                                className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none appearance-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
                                value={selectedDistrictId}
                                onChange={(e) => handleRegionChange('district', e)}
                                disabled={!selectedCityId && !formData.city}
                            >
                                <option value="">{formData.district || "Pilih..."}</option>
                                {districts.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Kelurahan</label>
                        <div className="relative">
                            <select 
                                className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none appearance-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
                                value={selectedVillageId}
                                onChange={(e) => handleRegionChange('village', e)}
                                disabled={!selectedDistrictId && !formData.district}
                            >
                                <option value="">{formData.village || "Pilih..."}</option>
                                {villages.map(v => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Kode Pos */}
                <div className="mb-3">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Kode Pos</label>
                    <input 
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleTextChange}
                        placeholder="Contoh: 50263"
                        className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                    />
                </div>

                {/* Detail Jalan */}
                <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Detail Jalan / Patokan</label>
                    <textarea 
                        name="detail"
                        value={formData.detail}
                        onChange={handleTextChange}
                        rows={3}
                        placeholder="Nama jalan, nomor rumah, RT/RW, atau patokan..."
                        className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all resize-none"
                    />
                </div>
            </div>

            {/* Tombol Simpan */}
            <div className="pt-2">
                <button 
                    type="submit" 
                    disabled={isSaving}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold text-white transition-all shadow-md active:scale-95 flex items-center justify-center gap-2
                        ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black shadow-gray-200'}
                    `}
                >
                    {isSaving ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Menyimpan...
                        </>
                    ) : 'Simpan Alamat'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}