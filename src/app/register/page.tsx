// src/app/register/page.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/features/auth/api';
import { RegisterPayload } from '@/features/auth/types';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<RegisterPayload['role']>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Password dan konfirmasi password harus sama.');
      return;
    }

    setIsLoading(true);

    try {
      const payload: RegisterPayload = {
        fullName,
        email,
        password,
        role,
      };

      const result = await registerUser(payload);
      localStorage.setItem('posko_token', result.data.tokens.accessToken);
      alert(`Pendaftaran berhasil, selamat datang ${result.data.profile.fullName}!`);
      router.push('/');
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } };
      const message = apiError.response?.data?.message || 'Gagal mendaftar, coba lagi nanti.';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-xl border border-emerald-50">
        <h1 className="text-3xl font-extrabold mb-2 text-center text-emerald-700">Daftar Akun Posko</h1>
        <p className="text-center text-gray-500 mb-6">Mulai gunakan Posko untuk mencari atau menawarkan layanan.</p>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-gray-700 text-sm font-semibold mb-2">Nama Lengkap</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-black"
                placeholder="Budi Santoso"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
              <input
                type="email"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-black"
                placeholder="contoh@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
              <input
                type="password"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-black"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Minimal 8 karakter untuk keamanan lebih baik.</p>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Konfirmasi Password</label>
              <input
                type="password"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-black"
                placeholder="********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 text-sm font-semibold mb-2">Peran</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`border rounded-lg px-4 py-3 text-left transition ${
                    role === 'customer'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-white text-gray-700'
                  }`}
                >
                  <span className="block font-semibold">Customer</span>
                  <span className="text-xs text-gray-500">Cari layanan terbaik untuk kebutuhanmu.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('provider')}
                  className={`border rounded-lg px-4 py-3 text-left transition ${
                    role === 'provider'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-white text-gray-700'
                  }`}
                >
                  <span className="block font-semibold">Provider</span>
                  <span className="text-xs text-gray-500">Tawarkan jasa dan kelola order dengan mudah.</span>
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition duration-200"
          >
            {isLoading ? 'Memproses...' : 'Buat Akun'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}