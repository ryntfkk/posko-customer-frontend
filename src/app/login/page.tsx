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
      localStorage.setItem('posko_token', result.data.tokens.accessToken);
      router.push('/');
      router.refresh();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Gagal login, periksa email atau password.';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Komponen Form (Reusable untuk Mobile & Desktop agar kode rapi)
  const LoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-5 w-full">
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl animate-pulse">
          ⚠️ {errorMsg}
        </div>
      )}
      <div>
        <label className="block text-gray-600 text-xs font-bold uppercase mb-2 tracking-wider">Email Address</label>
        <input
          type="email"
          className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-gray-600 text-xs font-bold uppercase tracking-wider">Password</label>
          <Link href="#" className="text-xs font-bold text-red-600 hover:underline">Lupa?</Link>
        </div>
        <input
          type="password"
          className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-gray-200 hover:bg-red-600 hover:shadow-red-200 hover:-translate-y-0.5 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed mt-4"
      >
        {isLoading ? 'Memproses...' : 'Masuk Sekarang'}
      </button>
    </form>
  );

  return (  
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      
      {/* =========================================
          TAMPILAN MOBILE (HP)
          Layout: Header Simpel -> Judul -> Form -> Footer
         ========================================= */}
      <div className="lg:hidden min-h-screen flex flex-col p-6">
        {/* Mobile Header */}
        <div className="flex items-center gap-2 mb-8">
          <div className="relative w-8 h-8">
             <Image src="/logo.png" alt="Logo" fill className="object-contain"/>
          </div>
          <span className="text-lg font-bold">Posko.</span>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Selamat Datang</h1>
          <p className="text-gray-500 mb-8 text-sm">Masuk untuk mulai mencari jasa di sekitarmu.</p>
          
          <LoginForm />

          <div className="mt-8 text-center text-sm text-gray-500">
            Belum punya akun? <Link href="/register" className="font-bold text-red-600">Daftar</Link>
          </div>
        </div>
      </div>

      {/* =========================================
          TAMPILAN DESKTOP (Laptop/PC)
          Layout: Split Screen (Kiri Form, Kanan Gambar)
         ========================================= */}
      <div className="hidden lg:flex min-h-screen">
        
        {/* Kolom Kiri (Form) */}
        <div className="w-1/2 flex flex-col justify-center px-24 py-12 relative bg-white z-10">
          <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 group">
            <div className="w-8 h-8 relative">
                <Image src="/logo.png" alt="Logo" fill className="object-contain"/>
            </div>
            <span className="text-xl font-bold group-hover:text-red-600 transition-colors">Posko<span className="text-red-600">.</span></span>
          </Link>

          <div className="max-w-md w-full mx-auto">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Welcome Back!</h1>
            <p className="text-gray-500 mb-10 text-lg">Kelola pesanan jasa profesional Anda dengan mudah.</p>
            
            <LoginForm />

            <p className="mt-8 text-center text-gray-500">
              Belum memiliki akun? <Link href="/register" className="font-bold text-red-600 hover:underline">Daftar Gratis</Link>
            </p>
          </div>
        </div>

        {/* Kolom Kanan (Gambar Artistik) */}
        <div className="w-1/2 bg-gray-100 relative overflow-hidden">
          <Image 
              src="https://images.unsplash.com/photo-1581578731117-10d526cbc790?q=80&w=1974&auto=format&fit=crop" 
              alt="Login Visual"
              fill
              className="object-cover"
              priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-16 text-white">
              <h2 className="text-4xl font-bold mb-4 leading-tight">Mitra Terpercaya <br/> Untuk Segala Masalah.</h2>
              <p className="text-gray-300 max-w-md">Bergabunglah dengan komunitas Posko dan nikmati kemudahan mencari teknisi profesional.</p>
          </div>
        </div>
      </div>

    </div>
  );
}