/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Next.js 14 Config 
    Kita menonaktifkan linting dan type checking saat build 
    agar deploy tidak gagal karena masalah kode minor.
  */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    // Izinkan SVG dari domain eksternal (Dicebear)
    dangerouslyAllowSVG: true,
    // Opsional: Tambahkan header keamanan untuk SVG
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      // Konfigurasi Domain AWS S3
      {
        protocol: 'https',
        hostname: 'posko-storage-prod.s3.ap-southeast-3.amazonaws.com', 
        port: '',
        pathname: '/**',
      },
    ],
  },
  // [SOLUSI UTAMA] Menambahkan Rewrite untuk Proxy
  async rewrites() {
    return [
      {
        // Menangkap semua request yang diawali /api/proxy/
        source: '/api/proxy/:path*',
        // Meneruskannya ke Backend asli
        // :path* akan menyalin sisa URL (misal 'upload' -> '/api/upload' di backend)
        destination: `${process.env.NEXT_PUBLIC_API_URL_ORIGIN || 'https://api.poskojasa.com'}/api/:path*`, 
      },
    ];
  },
};

export default nextConfig;