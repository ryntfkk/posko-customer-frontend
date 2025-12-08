// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import LanguageSwitcher from "@/components/LanguageSwitcher"; // [DIHAPUS]
import BottomNav from "@/components/BottomNav"; 
import QueryProvider from "@/providers/QueryProvider";

// Konfigurasi Font dari Google (Otomatis Download)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900 pb-24 lg:pb-0`} 
        suppressHydrationWarning={true}
      >
        <QueryProvider>
          {/* <LanguageSwitcher /> [DIHAPUS] agar tidak muncul global/floating lagi */}
          <main className="min-h-screen">
            {children}
          </main>
          <BottomNav />
        </QueryProvider>
      </body>
    </html>
  );
}