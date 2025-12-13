"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image"; // Import Image dari Next.js
import { X, ChevronRight } from "lucide-react"; // Hapus import Rocket

const ComingSoonModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // TARGET WAKTU: Set ke 2026 agar countdown berjalan
  const targetDate = new Date("2026-01-01T00:00:00").getTime();

  useEffect(() => {
    // Cek Local Storage (Gunakan key '_v6' untuk melihat perubahan logo ini)
    const hasSeenPopup = localStorage.getItem("hasSeenComingSoonPopup_v6");
    
    if (!hasSeenPopup) {
      setShowModal(true);
      document.body.style.overflow = "hidden";
    }

    // Logika Countdown
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const handleClose = () => {
    localStorage.setItem("hasSeenComingSoonPopup_v6", "true");
    setShowModal(false);
    document.body.style.overflow = "auto";
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      {/* Backdrop dengan warna biru tua pudar */}
      <div
        className="absolute inset-0 bg-[#020617]/60 backdrop-blur-sm transition-all duration-500"
        onClick={handleClose}
      ></div>

      {/* Modal Container: Border Gradient Merah-Biru */}
      <div className="relative w-full max-w-[380px] rounded-2xl p-[2px] shadow-2xl shadow-blue-900/30 animate-in fade-in zoom-in duration-300">
        {/* Animated Gradient Border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-600 via-white to-blue-600 animate-gradient-xy opacity-80"></div>
        
        {/* Modal Inner Content - SEMI-TRANSPARAN */}
        <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[#0f172a]/90 backdrop-blur-xl p-6 text-center border border-white/10">
          
          {/* Background Decoration */}
          <div className="absolute top-0 left-0 h-32 w-32 bg-blue-500/20 blur-[60px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 h-32 w-32 bg-red-500/20 blur-[60px] rounded-full pointer-events-none"></div>

          {/* Tombol Close */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 z-50 rounded-full bg-white/5 p-2 text-gray-400 hover:bg-white hover:text-black transition-all duration-300"
          >
            <X size={16} />
          </button>

          {/* --- ICON ANIMATION: DUAL RING REACTION --- */}
          <div className="relative z-10 mb-6 mt-2 flex justify-center">
            <div className="relative flex h-24 w-24 items-center justify-center">
               
               {/* Cincin Luar (Biru) - Berputar Lambat */}
               <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-500 opacity-80 animate-[spin_3s_linear_infinite] shadow-[0_0_20px_rgba(37,99,235,0.4)]"></div>
               
               {/* Cincin Dalam (Merah) - Berputar Cepat Lawan Arah */}
               <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-red-600 border-l-red-600 opacity-80 animate-[spin_2s_linear_infinite_reverse] shadow-[0_0_20px_rgba(220,38,38,0.4)]"></div>

               {/* Inti (Putih) dengan LOGO POSKO */}
               <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gray-800/80 to-black/80 border border-white/10 z-10 shadow-inner backdrop-blur-sm overflow-hidden">
                  {/* Menggunakan Next Image untuk logo */}
                  <Image 
                    src="/logo.png" 
                    alt="Posko Logo" 
                    width={30} 
                    height={30}
                    className="drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse object-contain"
                  />
               </div>

               {/* Partikel Melayang */}
               <span className="absolute top-0 right-2 h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping"></span>
               <span className="absolute bottom-2 left-1 h-1 w-1 rounded-full bg-red-500 animate-ping delay-300"></span>
            </div>
          </div>
          {/* ------------------------------------------ */}

          {/* Text Content */}
          <div className="relative z-10 space-y-3 mb-8">
            <div className="flex items-center justify-center gap-2">
                <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-red-500"></span>
                <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-white to-blue-400 animate-text-shimmer">
                  Grand Launching
                </h2>
                <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-blue-500"></span>
            </div>
            
            <h3 className="text-2xl font-black text-white tracking-tight leading-none">
              We are <span className="text-blue-500">The Pioneer</span> of <br/> 
              Indonesian <span className="text-red-500">Services</span>
            </h3>
            
            <p className="text-[11px] text-gray-300 px-4 font-light leading-relaxed">
              Your Problems, Solved Here.<br/>Indonesia’s First Service Marketplace.
            </p>
          </div>

          {/* Countdown Gradient Box */}
          <div className="relative z-10 mb-8 p-3 rounded-xl bg-black/20 border border-white/5 backdrop-blur-md">
             <div className="grid grid-cols-4 gap-2 divide-x divide-white/10">
                <CountdownItem label="DAYS" value={timeLeft.days} color="text-red-400" />
                <CountdownItem label="HRS" value={timeLeft.hours} color="text-white" />
                <CountdownItem label="MIN" value={timeLeft.minutes} color="text-white" />
                <CountdownItem label="SEC" value={timeLeft.seconds} color="text-blue-400" />
             </div>
          </div>

          {/* Footer CTA */}
          <div className="relative z-10">
            <button 
              onClick={handleClose}
              className="group w-full relative flex items-center justify-center gap-2 overflow-hidden rounded-lg bg-white/90 py-3 transition-all hover:scale-[1.02] hover:bg-white active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <span className="text-xs font-black uppercase tracking-wider text-black">
                Enter Posko 
              </span>
              <ChevronRight size={14} className="text-red-600 group-hover:translate-x-1 transition-transform"/>
            </button>
            <div className="mt-4 flex items-center justify-center gap-1.5 opacity-60">
               <div className="h-1 w-1 rounded-full bg-red-500"></div>
               <p className="text-[9px] font-mono text-gray-400">EST. RELEASE 2026</p>
               <div className="h-1 w-1 rounded-full bg-blue-500"></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// Sub-komponen Countdown
const CountdownItem = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="flex flex-col items-center justify-center px-1">
    <span className={`font-mono text-xl font-bold ${color} tabular-nums leading-none mb-1 drop-shadow-sm`}>
      {value.toString().padStart(2, "0")}
    </span>
    <span className="text-[8px] font-semibold text-gray-500 uppercase tracking-wider">
      {label}
    </span>
  </div>
);

export default ComingSoonModal;