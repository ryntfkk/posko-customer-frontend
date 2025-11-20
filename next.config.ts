import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com', // Mengizinkan gambar dari Google Drive
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // (Opsional) Tetap simpan jika masih pakai Unsplash
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;