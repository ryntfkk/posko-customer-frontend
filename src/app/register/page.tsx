// src/app/register/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/features/auth/api';
import { RegisterPayload, Role } from '@/features/auth/types';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok.');
      return;
    }

    // Validasi simpel (Opsional: sesuaikan regex dengan kebutuhan)
    if (password.length < 8) {
        setErrorMsg('Password minimal 8 karakter.');
        return;
    }

    setIsLoading(true);

    try {
      const payload: RegisterPayload = {
        fullName,
        email,
        password,
        roles: [role], // Mengirim array role sesuai tipe backend
      };

      await registerUser(payload);
      
      // Sukses
      alert('Registrasi Berhasil! Silakan login dengan akun baru Anda.');
      router.push('/login'); 

    } catch (error: any) {
      console.error('Register Error:', error);
      const message = error.response?.data?.message || 'Gagal mendaftar. Silakan coba lagi.';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row">
        
        {/* Visual Side (Mobile Hidden / Small Strip) */}
        <div className="hidden md:block w-2/5 bg-red-600 relative p-8 text-white flex flex-col justify-between">
            <div className="relative z-10">
                <Link href="/" className="flex items-center gap-2 mb-8 font-bold text-2xl">
                    Posko.
                </Link>
                <h2 className="text-3xl font-bold mb-4 leading-tight">Bergabunglah Bersama Kami</h2>
                <p className="text-red-100 text-sm">Nikmati kemudahan mencari jasa atau dapatkan penghasilan tambahan sebagai mitra.</p>
            </div>
            {/* Decorative Pattern */}
            <div className="absolute bottom-0 left-0 w-full h-full opacity-10">
                 <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                 </svg>
            </div>
        </div>

        {/* Form Side */}
        <div className="w-full md:w-3/5 p-8 sm:p-10">
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
                
                {/* Pilihan Role */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div 
                        onClick={() => setRole('customer')}
                        className={`cursor-pointer p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-center ${role === 'customer' ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-100 hover:border-gray-200 text-gray-500'}`}
                    >
                        <span className="text-xl">👤</span>
                        <div>
                            <span className="block text-xs font-bold">Pelanggan</span>
                            <span className="block text-[10px]">Cari Jasa</span>
                        </div>
                    </div>
                    <div 
                        onClick={() => setRole('provider')}
                        className={`cursor-pointer p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-center ${role === 'provider' ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-100 hover:border-gray-200 text-gray-500'}`}
                    >
                        <span className="text-xl">🛠️</span>
                        <div>
                            <span className="block text-xs font-bold">Mitra Jasa</span>
                            <span className="block text-[10px]">Tawarkan Jasa</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama Lengkap</label>
                        <input type="text" placeholder="Contoh: Budi Santoso" value={fullName} onChange={(e) => setFullName(e.target.value)} required 
                            className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none text-sm text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email</label>
                        <input type="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required 
                            className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none text-sm text-gray-900" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
                            <input type="password" placeholder="******" value={password} onChange={(e) => setPassword(e.target.value)} required 
                                className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none text-sm text-gray-900" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Konfirmasi</label>
                            <input type="password" placeholder="******" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required 
                                className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none text-sm text-gray-900" />
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <button type="submit" disabled={isLoading} className="w-full bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 hover:-translate-y-0.5 transition-all disabled:bg-gray-300">
                        {isLoading ? 'Sedang Mendaftar...' : 'Buat Akun'}
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