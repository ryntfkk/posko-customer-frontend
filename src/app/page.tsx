// src/app/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

// --- DATA KATEGORI ---
const categories = [
  { title: 'AC', icon: '/icons/air-conditioner.png' },
  { title: 'Listrik', icon: '/icons/electrician.png' },
  { title: 'Inspeksi', icon: '/icons/motor-inspector.png' },
  { title: 'Kebersihan', icon: '/icons/janitor.png' },
  { title: 'Perawatan', icon: '/icons/nail-art.png' },
  { title: 'Acara', icon: '/icons/decor.png' },
  { title: 'Hiburan', icon: '/icons/mc.png' },
  { title: 'Lainnya', icon: '/icons/logo-posko.png' },
];

// --- DATA TEKNISI ---
const technicians = [
  {
    id: 1,
    name: 'Raka Putra',
    skill: 'Teknisi AC & Pendingin',
    distance: '1.2 km',
    rating: 4.9,
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Raka',
    price: 'Rp 75rb',
    reviews: 120,
  },
  {
    id: 2,
    name: 'Dewi Pertiwi',
    skill: 'Layanan Kebersihan',
    distance: '0.8 km',
    rating: 5.0,
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dewi',
    price: 'Rp 50rb',
    reviews: 85,
  },
  {
    id: 3,
    name: 'Budi Hartono',
    skill: 'Montir Motor Panggilan',
    distance: '2.5 km',
    rating: 4.7,
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi',
    price: 'Rp 100rb',
    reviews: 210,
  },
  {
    id: 4,
    name: 'Siti Aminah',
    skill: 'Laundry Antar Jemput',
    distance: '1.5 km',
    rating: 4.8,
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Siti',
    price: 'Rp 15rb/kg',
    reviews: 300,
  },
];

// --- DUMMY CHAT DATA ---
const chats = [
    { id: 1, name: "Budi Hartono", msg: "Halo, bisa datang jam 3?", time: "10:30", unread: 1, img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Budi" },
    { id: 2, name: "Dewi Pertiwi", msg: "Terima kasih kak!", time: "Kemarin", unread: 0, img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dewi" },
];

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // State untuk UI Interaktif Desktop
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('posko_token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('posko_token');
    setIsLoggedIn(false);
    setIsProfileOpen(false); // Tutup dropdown
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-red-100">
      
      {/* =========================================
          TAMPILAN MOBILE (Tetap Sama)
         ========================================= */}
      <div className="lg:hidden pb-24">
        
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8">
               <Image src="/logo.png" alt="Posko Logo" fill className="object-contain"/>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-none">Posko</h1>
              <p className="text-[10px] text-red-500 font-medium mt-0.5">Jasa Terdekat</p>
            </div>
          </div>
          <div>
            {isLoggedIn ? (
               <button onClick={handleLogout} className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">Keluar</button>
            ) : (
              <Link href="/login" className="text-[11px] font-bold text-white bg-gray-900 px-4 py-2 rounded-full shadow-md">Masuk</Link>
            )}
          </div>
        </header>

        {/* Mobile Hero */}
        <section className="px-4 pt-6 pb-2">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 leading-tight">
            Cari jasa apa <br/>
            <span className="text-red-600 relative">
              sekarang?
              <svg className="absolute w-full h-2 -bottom-1 left-0 text-red-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" /></svg>
            </span>
          </h2>
          <p className="text-xs text-gray-500 mb-6 max-w-[280px]">
            Hubungkan dengan ratusan teknisi terverifikasi di sekitar Anda.
          </p>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <SearchIcon className="w-5 h-5 text-gray-400 group-focus-within:text-red-500" />
            </div>
            <input type="text" placeholder="Coba cari 'Servis AC'..." className="block w-full pl-11 pr-4 py-3.5 border-none rounded-2xl bg-white text-sm text-gray-900 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] ring-1 ring-gray-100 focus:ring-2 focus:ring-red-500 focus:outline-none" />
          </div>
        </section>

        {/* Mobile Banner */}
        <section className="mt-4 pl-4 overflow-x-auto no-scrollbar flex gap-3 pr-4">
          <PromoCardMobile color="red" title="Diskon 50%" subtitle="Pengguna Baru" btn="Klaim" />
          <PromoCardMobile color="dark" title="Garansi Puas" subtitle="Uang Kembali" btn="Cek Syarat" />
        </section>

        {/* Mobile Categories */}
        <section className="px-4 mt-6">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-base font-bold text-gray-900">Layanan</h3>
          </div>
          <div className="grid grid-cols-4 gap-y-5 gap-x-2">
            {categories.map((cat) => (
              <div key={cat.title} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
                <div className="relative w-[3.25rem] h-[3.25rem] bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden p-3">
                  <Image src={cat.icon} alt={cat.title} width={32} height={32} className="object-contain" />
                </div>
                <span className="text-[10px] font-medium text-gray-600 text-center line-clamp-1">{cat.title}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Mobile Technicians */}
        <section className="px-4 mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-gray-900">Mitra Pilihan</h3>
            <button className="text-xs font-bold text-red-600">Lihat Semua</button>
          </div>
          <div className="space-y-3">
            {technicians.map((tech) => (
              <TechCardMobile key={tech.id} tech={tech} />
            ))}
          </div>
        </section>

        {/* Mobile Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 pb-5 pt-2 px-4 bg-gradient-to-t from-white via-white/90 to-transparent z-40">
          <nav className="bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-2xl px-6 py-3.5 flex justify-between items-center">
            <NavItem icon={<HomeIcon active />} active />
            <NavItem icon={<OrderIcon />} />
            <NavItem icon={<ChatIcon />} />
            <NavItem icon={<UserIcon />} />
          </nav>
        </div>
      </div>


      {/* =========================================
          TAMPILAN DESKTOP (MODIFIKASI MARKETPLACE)
         ========================================= */}
      <div className="hidden lg:block">
        
        {/* Desktop Navbar */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-10">
              <Link href="/" className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                   <Image src="/logo.png" alt="Posko Logo" fill className="object-contain"/>
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">POSKO<span className="text-red-600">.</span></span>
              </Link>
              
            <nav className="flex gap-8 text-sm font-bold text-gray-600">
              <Link href="#" className="hover:text-red-600 transition-colors">Beranda</Link>
              <Link href="#" className="hover:text-red-600 transition-colors">Jasa</Link>
              <Link href="#" className="hover:text-red-600 transition-colors">Mitra</Link>
              {/* Menu Pesanan dipindah ke Header agar mudah diakses */}
              <Link href="#" className="hover:text-red-600 transition-colors">Pesanan</Link>
            </nav>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative w-72">
                <input type="text" placeholder="Cari layanan atau teknisi..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all" />
                <SearchIcon className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              </div>
              
              {/* LOGIC LOGIN / PROFILE DROPDOWN */}
              {isLoggedIn ? (
                 <div className="relative">
                    {/* Tombol Profile */}
                    <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group"
                    >
                        <div className="text-right hidden xl:block">
                            <p className="text-xs font-bold text-gray-900">Halo, User</p>
                            <p className="text-[10px] text-gray-500 font-medium">Member Gold</p>
                        </div>
                        <div className="w-9 h-9 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                    </button>

                    {/* DROPDOWN MENU */}
                    {isProfileOpen && (
                        <>
                            {/* Backdrop transparan untuk menutup dropdown saat klik luar */}
                            <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                            
                            <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden z-50 animate-fadeIn origin-top-right">
                                <div className="p-4 border-b border-gray-50">
                                    <p className="text-sm font-bold text-gray-900">User Posko</p>
                                    <p className="text-xs text-gray-500 truncate">user@example.com</p>
                                </div>
                                <div className="py-2">
                                    <Link href="#" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors">
                                        <UserIcon /> Edit Profile
                                    </Link>
                                    <Link href="#" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors">
                                        <span className="w-5 h-5 flex items-center justify-center">⚙️</span> Pengaturan
                                    </Link>
                                    <Link href="#" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors">
                                        <span className="w-5 h-5 flex items-center justify-center">❓</span> Bantuan
                                    </Link>
                                </div>
                                <div className="border-t border-gray-50 p-2">
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                        Keluar
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                 </div>
              ) : (
                <div className="flex gap-3">
                   <Link href="/login" className="text-sm font-bold text-gray-600 hover:text-gray-900 px-4 py-2">Masuk</Link>
                   <Link href="/register" className="text-sm font-bold text-white bg-red-600 hover:bg-red-700 px-5 py-2 rounded-full shadow-lg shadow-red-200 transition-all hover:-translate-y-0.5">Daftar</Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Desktop Content (Hero, Categories, Grid) - SAMA SEPERTI SEBELUMNYA */}
        <section className="relative bg-white border-b border-gray-100 overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-red-50/50 -skew-x-12 translate-x-20"></div>
          <div className="max-w-7xl mx-auto px-8 py-20 grid grid-cols-2 items-center relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold mb-6 border border-red-100">
                <span>🚀</span> Marketplace Jasa #1 di Indonesia
              </div>
              <h1 className="text-5xl font-black text-gray-900 leading-[1.15] mb-6">
                Solusi Jasa Profesional <br/>
                di <span className="text-red-600 relative inline-block">
                  Ujung Jari
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-red-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" /></svg>
                </span>
              </h1>
              <p className="text-lg text-gray-500 mb-8 max-w-lg leading-relaxed">
                Temukan teknisi AC, montir, hingga layanan kebersihan terbaik di sekitar Anda dengan harga transparan dan garansi layanan.
              </p>
              <div className="flex gap-4">
                <button className="bg-red-600 text-white font-bold px-8 py-3.5 rounded-xl shadow-xl shadow-red-200 hover:bg-red-700 transition-transform hover:-translate-y-1">Cari Jasa Sekarang</button>
                <button className="bg-white text-gray-700 font-bold px-8 py-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">Gabung Mitra</button>
              </div>
            </div>
            <div className="relative h-96 w-full rounded-3xl bg-gray-100 border border-gray-200 overflow-hidden group shadow-xl">
                <Image src="https://drive.google.com/uc?export=view&id=1izUc0As5ae1dFrNaiZcWGqDn28nSRnsY" alt="Ilustrasi Teknisi" fill className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105" priority sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-8 py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Jelajahi Kategori</h2>
          <div className="grid grid-cols-8 gap-6">
            {categories.map((cat) => (
              <Link href="#" key={cat.title} className="group flex flex-col items-center gap-4 p-6 rounded-2xl bg-white border border-gray-100 hover:border-red-200 hover:shadow-xl hover:shadow-red-50/50 transition-all duration-300">
                <div className="relative w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-red-50 transition-all p-3">
                  <Image src={cat.icon} alt={cat.title} width={40} height={40} className="object-contain"/>
                </div>
                <span className="font-semibold text-gray-700 group-hover:text-red-600 transition-colors">{cat.title}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-white py-16 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex justify-between items-end mb-10">
              <div><h2 className="text-3xl font-bold text-gray-900 mb-2">Rekomendasi di Sekitarmu</h2><p className="text-gray-500">Mitra teknisi dengan rating tertinggi minggu ini.</p></div>
              <Link href="#" className="text-red-600 font-bold hover:underline decoration-2 underline-offset-4">Lihat Semua Mitra →</Link>
            </div>
            <div className="grid grid-cols-4 gap-8">
              {technicians.map((tech) => (
                <div key={tech.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1">
                  <div className="h-48 bg-gray-100 relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
                     <img src={tech.image} alt={tech.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     <div className="absolute bottom-3 left-3 text-white"><p className="text-xs font-medium opacity-90">{tech.distance}</p><p className="font-bold">{tech.skill}</p></div>
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3"><h3 className="text-lg font-bold text-gray-900">{tech.name}</h3><div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100"><span className="text-xs text-yellow-600">★</span><span className="text-xs font-bold text-gray-900">{tech.rating}</span></div></div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-6"><span>💼 {tech.reviews} Pesanan</span></div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50"><div className="flex flex-col"><span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Mulai Dari</span><span className="text-red-600 font-bold text-lg">{tech.price}</span></div><button className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 transition-colors">Pesan</button></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        <footer className="bg-gray-50 border-t border-gray-200 py-12 text-center"><p className="text-gray-400 font-medium">© 2024 Posko Services. All rights reserved.</p></footer>

        {/* --- FITUR FLOATING CHAT (Desktop) --- */}
        {isLoggedIn && (
          <>
            {/* Jendela Chat Pop-up */}
            {isChatOpen && (
                <div className="fixed bottom-24 right-32 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col animate-fadeIn overflow-hidden">
                    <div className="bg-red-600 p-4 flex justify-between items-center text-white shadow-sm">
                        <h3 className="font-bold text-sm flex items-center gap-2">
                            <ChatIcon /> Pesan (2)
                        </h3>
                        <button onClick={() => setIsChatOpen(false)} className="hover:bg-red-700 p-1 rounded transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {chats.map(chat => (
                            <div key={chat.id} className="flex gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                                <div className="relative w-10 h-10 shrink-0">
                                    <img src={chat.img} className="w-full h-full rounded-full bg-gray-100 border border-gray-200" />
                                    {chat.unread > 0 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <h4 className="text-sm font-bold text-gray-900 truncate">{chat.name}</h4>
                                        <span className="text-[10px] text-gray-400">{chat.time}</span>
                                    </div>
                                    <p className={`text-xs truncate ${chat.unread > 0 ? 'font-bold text-gray-800' : 'text-gray-500'}`}>{chat.msg}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
                        <Link href="#" className="text-xs font-bold text-red-600 hover:underline">Lihat Semua Pesan</Link>
                    </div>
                </div>
            )}

            {/* Tombol Chat Floating */}
            <button 
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="fixed bottom-8 right-32 z-40 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.15)] px-5 py-3 rounded-full flex items-center gap-2.5 transition-all hover:-translate-y-1 hover:shadow-xl group"
            >
                <div className="relative">
                    <ChatIcon className="w-6 h-6 text-red-600" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-white"></span>
                </div>
                <span className="font-bold text-sm hidden group-hover:inline-block transition-all">Chat</span>
            </button>
          </>
        )}

      </div>

    </main>
  );
}

// --- KOMPONEN KECIL (MOBILE) ---

function PromoCardMobile({ color, title, subtitle, btn }: { color: 'red'|'dark', title: string, subtitle: string, btn: string }) {
  const bgClass = color === 'red' ? 'bg-gradient-to-br from-red-600 to-orange-600 shadow-red-200' : 'bg-gray-900 shadow-gray-200';
  return (
    <div className={`w-[280px] h-36 rounded-2xl ${bgClass} p-5 flex flex-col justify-between text-white shadow-lg relative overflow-hidden shrink-0`}>
      <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
      <div>
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase ${color === 'red' ? 'bg-white/20' : 'bg-red-600'}`}>Promo</span>
        <h3 className="font-bold text-xl mt-2 leading-tight">{title} <br/>{subtitle}</h3>
      </div>
      <button className={`w-fit text-[10px] font-bold px-3 py-1.5 rounded-full ${color === 'red' ? 'bg-white text-red-600' : 'bg-white/10 border border-white/20'}`}>{btn}</button>
    </div>
  )
}

function TechCardMobile({ tech }: { tech: any }) {
  return (
    <div className="bg-white p-3 rounded-2xl border border-gray-50 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center gap-3 active:scale-[0.99] transition-transform">
      <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
        <img src={tech.image} alt={tech.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex justify-between items-center mb-0.5">
          <h4 className="font-bold text-sm text-gray-900 truncate">{tech.name}</h4>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-yellow-500">★</span>
            <span className="text-[10px] font-bold text-gray-700">{tech.rating}</span>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 truncate font-medium">{tech.skill} • {tech.distance}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">Mulai {tech.price}</span>
        </div>
      </div>
      <button className="h-9 px-4 rounded-xl border border-red-100 text-red-600 text-xs font-bold hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center">Chat</button>
    </div>
  )
}

function NavItem({ icon, active = false }: { icon: React.ReactNode; active?: boolean }) {
  return (
    <button className={`flex flex-col items-center justify-center gap-1 w-12 ${active ? 'text-red-600' : 'text-gray-400'} transition-colors`}>
      <div className="relative">
        {icon}
        {active && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-600 rounded-full border-2 border-white"></span>}
      </div>
    </button>
  );
}

// --- ICONS (SVG) ---
const SearchIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;
const HomeIcon = ({ active }: { active?: boolean }) => <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>;
const OrderIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>;
const ChatIcon = ({ className = "w-6 h-6" }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>;
const UserIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>;