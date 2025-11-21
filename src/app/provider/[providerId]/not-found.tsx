import Link from 'next/link';

export default function ProviderNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 max-w-lg text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-red-600 font-black text-lg">
          !
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-gray-900">Mitra tidak ditemukan</h1>
          <p className="text-gray-600">
            Kami tidak menemukan profil mitra yang Anda cari. Silakan pilih mitra lain atau kembali ke halaman layanan.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/services/ac" className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors">
            Pilih mitra lain
          </Link>
          <Link href="/" className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100">
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}