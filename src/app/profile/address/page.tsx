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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
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

  // State Loading untuk API Wilayah
  const [wilayahLoading, setWilayahLoading] = useState({
    cities: false,
    districts: false,
    villages: false
  });

  // 1.Load Data User & Provinsi saat pertama kali buka
  useEffect(() => {
    const initData = async () => {
      try {
        // Fetch Provinces
        const provRes = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
        if (! provRes.ok) {
          throw new Error('Gagal memuat data provinsi');
        }
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
          if (user.location && user.location.coordinates && Array.isArray(user.location.coordinates)) {
            setCoordinates({
              lng: user.location.coordinates[0],
              lat: user.location.coordinates[1]
            });
          }
        }
      } catch (error) {
        console.error("Gagal memuat data:", error);
        setErrorMessage('Gagal memuat data. Pastikan koneksi internet stabil.');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  // 2.Handler Perubahan Dropdown Wilayah
  const handleRegionChange = (type: 'province' | 'city' | 'district' | 'village', e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const index = e.target.selectedIndex;
    const text = index > 0 ? e.target.options[index].text : '';

    setErrorMessage(null);

    if (type === 'province') {
      setSelectedProvId(id); 
      setSelectedCityId(''); 
      setSelectedDistrictId(''); 
      setSelectedVillageId('');
      setCities([]); 
      setDistricts([]); 
      setVillages([]);
      
      setFormData(prev => ({ 
        ...prev, 
        province: text, 
        city: '', 
        district: '', 
        village: '', 
        postalCode: '' 
      }));

      if(id) {
        setWilayahLoading(prev => ({ ...prev, cities: true }));
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${id}.json`)
          .then(r => {
            if (!r.ok) throw new Error('Gagal memuat kota');
            return r.json();
          })
          .then(setCities)
          .catch(err => {
            console.error(err);
            setErrorMessage('Gagal memuat data kota.Silakan coba lagi.');
          })
          .finally(() => setWilayahLoading(prev => ({ ...prev, cities: false })));
      }
    } 
    else if (type === 'city') {
      setSelectedCityId(id); 
      setSelectedDistrictId(''); 
      setSelectedVillageId('');
      setDistricts([]); 
      setVillages([]);
      
      setFormData(prev => ({ 
        ...prev, 
        city: text, 
        district: '', 
        village: '', 
        postalCode: '' 
      }));

      if(id) {
        setWilayahLoading(prev => ({ ...prev, districts: true }));
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${id}.json`)
          .then(r => {
            if (!r.ok) throw new Error('Gagal memuat kecamatan');
            return r.json();
          })
          .then(setDistricts)
          .catch(err => {
            console.error(err);
            setErrorMessage('Gagal memuat data kecamatan. Silakan coba lagi.');
          })
          .finally(() => setWilayahLoading(prev => ({ ...prev, districts: false })));
      }
    } 
    else if (type === 'district') {
      setSelectedDistrictId(id); 
      setSelectedVillageId('');
      setVillages([]);
      
      setFormData(prev => ({ 
        ...prev, 
        district: text, 
        village: '', 
        postalCode: '' 
      }));

      if(id) {
        setWilayahLoading(prev => ({ ...prev, villages: true }));
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${id}.json`)
          .then(r => {
            if (!r.ok) throw new Error('Gagal memuat kelurahan');
            return r.json();
          })
          .then(setVillages)
          .catch(err => {
            console.error(err);
            setErrorMessage('Gagal memuat data kelurahan.Silakan coba lagi.');
          })
          .finally(() => setWilayahLoading(prev => ({ ...prev, villages: false })));
      }
    }
    else if (type === 'village') {
      setSelectedVillageId(id);
      
      setFormData(prev => ({ 
        ...prev, 
        village: text, 
        postalCode: '' // Kosongkan untuk user input manual
      }));
    }
  };

  // 3.Handler Input Text Biasa (Detail Alamat & Kode Pos Manual)
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMessage(null);
  };

  // 4.Handler Lokasi dari Peta
  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setCoordinates({ lat, lng });
    setErrorMessage(null);
  }, []);

  // 5.Handler Get Current Location (GPS)
  const handleGetCurrentLocation = () => {
    if (! navigator.geolocation) {
      setErrorMessage('Browser Anda tidak mendukung Geolocation.');
      return;
    }

    const geolocationOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setErrorMessage(null);
        setSuccessMessage('Lokasi berhasil diambil dari GPS');
        setTimeout(() => setSuccessMessage(null), 3000);
      },
      (err) => {
        console.error(err);
        let errorMsg = 'Gagal mengambil lokasi GPS.';
        if (err.code === err.PERMISSION_DENIED) {
          errorMsg = 'Ijin akses lokasi ditolak. Periksa setting browser Anda.';
        } else if (err.code === err.TIMEOUT) {
          errorMsg = 'Permintaan lokasi timeout.Pastikan GPS aktif.';
        }
        setErrorMessage(errorMsg);
      },
      geolocationOptions
    );
  };

  // 6. Validasi Form Data
  const validateForm = (): boolean => {
    // Validasi Provinsi
    if (!formData.province || formData.province.trim().length === 0) {
      setErrorMessage('Silakan pilih Provinsi');
      return false;
    }

    // Validasi Kota
    if (!formData.city || formData.city.trim().length === 0) {
      setErrorMessage('Silakan pilih Kota/Kabupaten');
      return false;
    }

    // Validasi Detail Jalan
    if (!formData.detail || formData.detail.trim().length === 0) {
      setErrorMessage('Detail jalan/patokan tidak boleh kosong');
      return false;
    }

    if (formData.detail.trim().length < 10) {
      setErrorMessage('Detail jalan minimal 10 karakter');
      return false;
    }

    // Validasi Kode Pos (optional tapi jika ada harus format)
    if (formData.postalCode && formData.postalCode.trim().length > 0) {
      if (!/^\d{5}$/.test(formData.postalCode.trim())) {
        setErrorMessage('Kode pos harus 5 digit angka');
        return false;
      }
    }

    // Validasi Koordinat
    if (! coordinates.lat || !coordinates.lng) {
      setErrorMessage('Silakan tentukan titik lokasi di peta atau gunakan GPS');
      return false;
    }

    // Validasi koordinat dalam range valid
    if (coordinates.lat < -90 || coordinates.lat > 90) {
      setErrorMessage('Koordinat latitude tidak valid');
      return false;
    }

    if (coordinates.lng < -180 || coordinates.lng > 180) {
      setErrorMessage('Koordinat longitude tidak valid');
      return false;
    }

    return true;
  };

  // 7.Submit Data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validasi form terlebih dahulu
    if (! validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      // Payload Update dengan struktur yang sesuai backend
      const payload = {
        address: {
          province: formData.province.trim(),
          city: formData.city.trim(),
          district: formData.district.trim(),
          village: formData.village.trim(),
          postalCode: formData.postalCode.trim(),
          detail: formData.detail.trim()
        },
        location: {
          type: 'Point',
          coordinates: [coordinates.lng, coordinates.lat] // GeoJSON format: [long, lat]
        }
      };

      await updateProfile(payload);
      
      setSuccessMessage('Alamat berhasil diperbarui!');
      
      // Delay redirect untuk user bisa melihat success message
      setTimeout(() => {
        router.push('/profile');
        router.refresh();
      }, 1500);
    } catch (error: any) {
      console.error('Error saat save:', error);
      const errorMsg = error.response?.data?.message || 'Gagal menyimpan perubahan alamat. Silakan coba lagi.';
      setErrorMessage(errorMsg);
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
        
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-start gap-2">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}
        
        {/* SECTION 1: MAPS */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Titik Lokasi *</h2>
              <p className="text-[10px] text-gray-500">Geser pin untuk akurasi lokasi</p>
            </div>
            {coordinates.lat && (
              <span className="text-[9px] bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 font-medium">
                ✓ Terpilih
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
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Provinsi *</label>
              <div className="relative">
                <select 
                  className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none appearance-none"
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
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Kota / Kabupaten *</label>
              <div className="relative">
                <select 
                  className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={selectedCityId}
                  onChange={(e) => handleRegionChange('city', e)}
                  disabled={!selectedProvId || wilayahLoading.cities}
                >
                  <option value="">{wilayahLoading.cities ? 'Memuat...' : formData.city || "Pilih Kota"}</option>
                  {cities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                  {wilayahLoading.cities ?  (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  )}
                </div>
              </div>
            </div>

            {/* Grid Kecamatan & Kelurahan */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Kecamatan</label>
                <div className="relative">
                  <select 
                    className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={selectedDistrictId}
                    onChange={(e) => handleRegionChange('district', e)}
                    disabled={!selectedCityId || wilayahLoading.districts}
                  >
                    <option value="">{wilayahLoading.districts ? 'Memuat...' : formData.district || "Pilih..."}</option>
                    {districts.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                    {wilayahLoading.districts ? (
                      <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Kelurahan</label>
                <div className="relative">
                  <select 
                    className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={selectedVillageId}
                    onChange={(e) => handleRegionChange('village', e)}
                    disabled={!selectedDistrictId || wilayahLoading.villages}
                  >
                    <option value="">{wilayahLoading.villages ? 'Memuat...' : formData.village || "Pilih..."}</option>
                    {villages.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                    {wilayahLoading.villages ?  (
                      <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Kode Pos */}
            <div className="mb-3">
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Kode Pos (5 digit)</label>
              <input 
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleTextChange}
                placeholder="Contoh: 50263"
                maxLength={5}
                className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
              />
            </div>

            {/* Detail Jalan */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Detail Jalan / Patokan *</label>
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