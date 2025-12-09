import type { Metadata } from "next";
import { Inter } from "next/font/google"; 
import "./globals.css";
import "leaflet/dist/leaflet.css"; 
import BottomNav from "@/components/BottomNav"; 
import QueryProvider from "@/providers/QueryProvider";
import { LanguageProvider } from "@/context/LanguageContext";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter", 
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
        className={`${inter.className} ${inter.variable} antialiased bg-gray-50 text-gray-900 pb-24 lg:pb-0`} 
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