// src/components/OrderComponents.tsx
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix icon marker default leaflet yang sering hilang di Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// --- KOMPONEN MAP PICKER ---

interface LocationPickerProps {
  initialLat: number;
  initialLng: number;
  onLocationChange: (lat: number, lng: number) => void;
}

function MapController({ coords, onLocationChange }: { coords: [number, number], onLocationChange: (lat: number, lng: number) => void }) {
  const map = useMap();

  // Update center map saat koordinat berubah (misal user geser marker atau input manual)
  useEffect(() => {
    map.flyTo(coords, map.getZoom());
  }, [coords, map]);

  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

export function LocationPicker({ initialLat, initialLng, onLocationChange }: LocationPickerProps) {
  // Gunakan state lokal untuk visualisasi instan
  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng]);

  const handleDragEnd = (e: any) => {
    const marker = e.target;
    const position = marker.getLatLng();
    setPosition([position.lat, position.lng]);
    onLocationChange(position.lat, position.lng);
  };

  const mapCenter = useMemo<[number, number]>(() => [initialLat, initialLng], [initialLat, initialLng]);

  return (
    // REFINED: Height responsif (h-56 mobile, h-96 desktop)
    <div className="w-full h-56 lg:h-96 rounded-xl overflow-hidden border border-gray-200 relative z-0 shadow-sm group">
      <MapContainer 
        center={mapCenter} 
        zoom={15} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker 
          position={position} 
          icon={icon}
          draggable={true}
          eventHandlers={{
            dragend: handleDragEnd,
          }}
        />
        <MapController coords={position} onLocationChange={(lat, lng) => {
           setPosition([lat, lng]);
           onLocationChange(lat, lng);
        }} />
      </MapContainer>
      
      {/* REFINED: Overlay instruksi berupa Pill kecil, bukan block besar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-700 z-[400] shadow-sm border border-gray-200 pointer-events-none flex items-center gap-1.5 animate-fadeIn">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        Geser pin ke lokasi tepat
      </div>
    </div>
  );
}

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