// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google"; // [FIX] Ganti Geist dengan Inter yang support Next.js 14
import "./globals.css";
import BottomNav from "@/components/BottomNav"; 
import QueryProvider from "@/providers/QueryProvider";
import { LanguageProvider } from "@/context/LanguageContext";

// [FIX] Inisialisasi font Inter
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter", // Opsional: untuk keperluan Tailwind jika diperlukan
});

export const metadata: Metadata = {
  title: "Posko - Jasa Terdekat",
  description: "Aplikasi penyedia jasa profesional terdekat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        // [FIX] Gunakan inter.className menggantikan variable Geist
        className={`${inter.className} antialiased bg-gray-50 text-gray-900 pb-24 lg:pb-0`} 
        suppressHydrationWarning={true}
      >
        <QueryProvider>
          <LanguageProvider>
            <main className="min-h-screen">
              {children}
            </main>
            <BottomNav />
          </LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  );
}