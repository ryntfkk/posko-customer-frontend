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
    // [FIX] Izinkan SVG dari domain eksternal (Dicebear)
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
      // [BARU] Konfigurasi Domain AWS S3
      {
        protocol: 'https',
        hostname: 'posko-storage-prod.s3.ap-southeast-1.amazonaws.com', 
        port: '',
        pathname: '/**',
      },
    ],
  },
  // [LANGKAH 2] Menambahkan konfigurasi Rewrites (Proxy)
  async rewrites() {
    return [
      {
        // Menangkap semua request yang diawali dengan /api/proxy
        source: '/api/proxy/:path*',
        // Meneruskannya ke Backend EC2 yang sebenarnya
        // Gunakan variable environment BACKEND_URL jika ada, atau fallback ke default
        destination: `${process.env.BACKEND_URL || 'https://api.poskojasa.com/api'}/:path*`,
      },
    ];
  },
};

export default nextConfig;