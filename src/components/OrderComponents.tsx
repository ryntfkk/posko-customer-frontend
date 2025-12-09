'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

// --- KOMPONEN FILE UPLOADER ---

interface AttachmentUploaderProps {
  // [FIX] Menambahkan tanda tanya (?) pada description agar opsional
  attachments: { url: string; type: string; description?: string; file?: File }[]; 
  onAdd: (file: File, description: string) => void;
  onRemove: (index: number) => void;
}

export function AttachmentUploader({ attachments, onAdd, onRemove }: AttachmentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validasi ukuran (misal max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran file terlalu besar (maks 5MB)");
        return;
      }

      onAdd(file, description);
      setDescription(''); // Reset deskripsi
      
      // Reset input agar bisa pilih file yang sama lagi kalau mau
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* REFINED: Layout Input Compact (Flex Row) */}
      <div className="flex gap-2 items-center">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        
        {/* Tombol Upload (Icon + Text di Desktop, Icon Only di Mobile Kecil) */}
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={attachments.length >= 5}
          className="shrink-0 h-9 px-3 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="hidden sm:inline">Foto</span>
        </button>

        {/* Input Deskripsi (Full Width) */}
        <div className="flex-1 relative">
           <input 
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: AC bocor di kamar..."
              className="w-full h-9 pl-3 pr-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-all placeholder:text-gray-400 shadow-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && description.trim()) {
                   e.preventDefault();
                   fileInputRef.current?.click();
                }
              }}
            />
        </div>
      </div>

      {/* REFINED: Grid Thumbnail (Lebih Kecil & Rapat) */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 animate-fadeIn">
          {attachments.map((att, index) => (
            <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-square">
              <Image 
                src={att.url} 
                alt={att.description || `Lampiran ${index + 1}`}
                fill
                className="object-cover"
              />
              
              {/* Overlay Deskripsi (Hanya muncul saat hover di desktop) */}
              {att.description && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <p className="text-[9px] text-white truncate text-center font-medium">{att.description}</p>
                </div>
              )}

              {/* Tombol Hapus (Kecil di pojok) */}
              <button 
                type="button"
                onClick={() => onRemove(index)}
                className="absolute top-1 right-1 w-5 h-5 bg-white/90 text-red-600 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors z-10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}