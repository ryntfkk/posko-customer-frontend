import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
// [BARU] Import komponen switcher
import LanguageSwitcher from "@/components/LanguageSwitcher";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
      >
        {/* [BARU] Tambahkan komponen disini agar muncul di semua halaman */}
        <LanguageSwitcher />
        
        {children}
      </body>
    </html>
  );
}