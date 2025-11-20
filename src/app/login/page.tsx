// src/app/login/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/features/auth/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const result = await loginUser({ email, password });

      // Simpan token sesuai struktur respons backend
      localStorage.setItem('posko_token', result.data.tokens.accessToken);
      
      // Opsional: Simpan data user basic jika perlu
      // localStorage.setItem('posko_user', JSON.stringify(result.data.profile));

      // Redirect ke dashboard
      router.push('/');
      router.refresh(); // Refresh agar state login di header berubah
    } catch (error: any) {
      const message = error.response?.data?.message || 'Gagal login, periksa email atau password.';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (  
    <div className="min-h-screen flex bg-white">
      
      {/* Bagian Kiri: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12">
        <div className="mb-10">
          <Link href="/" className="flex items-center gap-2 mb-8 w-fit group">
            <div className="w-8 h-8 relative">
                <Image src="/logo.png" alt="Posko Logo" fill className="object-contain"/>
            </div>
            <span className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">Posko<span className="text-red-600">.</span></span>
          </Link>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Selamat Datang Kembali</h1>
          <p className="text-gray-500">Masuk untuk mengelola pesanan atau mencari jasa.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r shadow-sm">
            <p className="font-bold">Terjadi Kesalahan</p>
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-gray-700 text-sm font-bold">Password</label>
              <Link href="#" className="text-xs font-semibold text-red-600 hover:text-red-700">Lupa Password?</Link>
            </div>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-red-600 hover:shadow-red-200 hover:-translate-y-0.5 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memproses...
                </span>
            ) : 'Masuk Sekarang'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Belum punya akun?{' '}
          <Link href="/register" className="font-bold text-red-600 hover:underline">
            Daftar Gratis
          </Link>
        </div>
      </div>

      {/* Bagian Kanan: Gambar (Hanya Desktop) */}
      <div className="hidden lg:block w-1/2 bg-gray-100 relative overflow-hidden">
        <Image 
            src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop" 
            alt="Login Visual"
            fill
            className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-12 text-white">
            <h2 className="text-4xl font-bold mb-4">Solusi Jasa Profesional</h2>
            <p className="text-lg text-gray-200 max-w-md">Terhubung dengan ribuan teknisi terpercaya di sekitar Anda dengan cepat dan aman.</p>
        </div>
      </div>
    </div>
  );
}