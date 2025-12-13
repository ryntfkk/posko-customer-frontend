"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

const ComingSoonModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Target: 1 Januari 2025, 00:00:00
  const targetDate = new Date("2025-01-01T00:00:00").getTime();

  useEffect(() => {
    // 1. Cek Local Storage saat pertama kali load
    // Kita gunakan nama key yang unik agar tidak bentrok
    const hasSeenPopup = localStorage.getItem("hasSeenComingSoonPopup_v1");
    
    if (!hasSeenPopup) {
      setShowModal(true);
      // Opsional: Kunci scroll body saat modal aktif agar user fokus
      document.body.style.overflow = "hidden";
    }

    // 2. Logika Countdown Timer
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
    // Simpan status di localStorage agar tidak muncul lagi di sesi berikutnya
    localStorage.setItem("hasSeenComingSoonPopup_v1", "true");
    setShowModal(false);
    // Kembalikan scroll body
    document.body.style.overflow = "auto";
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 transition-opacity duration-300">
      {/* Backdrop Gelap dengan Blur */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal Content */}
      <div className="modal-entrance-animation relative w-full max-w-[320px] overflow-hidden rounded-xl border border-blue-500/30 bg-gray-950/95 p-5 text-center shadow-2xl shadow-blue-500/10 ring-1 ring-white/5 backdrop-blur-md md:max-w-md">
        {/* Efek Garis Scanner Hiasan (Animasi dari globals.css) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
          <div className="animate-scanline"></div>
        </div>

        {/* Tombol Close X */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 z-50 rounded-full bg-white/5 p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close modal"
        >
          <X size={14} />
        </button>

        {/* Header Text */}
        <div className="relative z-10 mb-3">
          <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30">
             <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse"></div>
          </div>
          <h2 className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-sm font-bold uppercase tracking-widest text-transparent md:text-base">
            System Status
          </h2>
          <h3 className="text-lg font-bold text-white md:text-xl">
            Developing
          </h3>
          <p className="mt-1 text-[10px] text-gray-400 md:text-xs">
            Website ini sedang dalam tahap pengembangan intensif.
          </p>
        </div>

        {/* Countdown Container */}
        <div className="relative z-10 my-4 rounded-lg border border-blue-500/20 bg-blue-950/20 p-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-blue-300/60">
            Launch Countdown
          </p>

          {/* Grid Countdown Box */}
          <div className="grid grid-cols-4 gap-2">
            <CountdownBox label="Days" value={timeLeft.days} />
            <CountdownBox label="Hours" value={timeLeft.hours} />
            <CountdownBox label="Mins" value={timeLeft.minutes} />
            <CountdownBox label="Secs" value={timeLeft.seconds} />
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 flex flex-col items-center gap-1">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
          <p className="pt-2 text-[10px] text-gray-500">
            Estimated Release: 01.01.2025
          </p>
        </div>
      </div>
    </div>
  );
};

// Komponen kecil untuk kotak angka countdown
const CountdownBox = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col items-center rounded bg-black/40 py-2 ring-1 ring-blue-500/10">
    <span className="countdown-pulse font-mono text-base font-bold text-white md:text-lg">
      {value.toString().padStart(2, "0")}
    </span>
    <span className="mt-0.5 text-[8px] uppercase tracking-wider text-blue-400/80">
      {label}
    </span>
  </div>
);

export default ComingSoonModal;