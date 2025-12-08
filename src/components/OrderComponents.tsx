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
    // REFINED: Height dikurangi di mobile (h-48 / 192px) agar form di bawahnya terlihat.
    // Desktop (h-80 / 320px) lebih lega.
    <div className="w-full h-48 lg:h-80 rounded-xl overflow-hidden border border-gray-200 relative z-0 shadow-inner group">
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
      
      {/* REFINED: Overlay instruksi dibuat pill kecil melayang, bukan bar penuh di bawah */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-medium text-gray-600 z-[400] shadow-sm border border-white/50 whitespace-nowrap opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none">
        Geser pin untuk set lokasi tepat
      </div>
    </div>
  );
}

// --- KOMPONEN FILE UPLOADER ---

interface AttachmentUploaderProps {
  attachments: { url: string; type: string; description: string; file?: File }[]; 
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
      {/* REFINED: Input area lebih compact. Flex row di mobile juga jika muat. */}
      <div className="flex gap-2 items-center">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <div className="flex-1 relative">
           <input 
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ket. foto (opsional)..."
              className="w-full pl-3 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder:text-gray-400"
            />
        </div>

        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={attachments.length >= 5}
          className="shrink-0 px-3 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="hidden sm:inline">Upload</span>
          <span className="sm:hidden">+</span>
        </button>
      </div>

      {attachments.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {attachments.map((att, index) => (
            <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              {/* REFINED: Aspect ratio square tetap oke, tapi rounded lebih kecil */}
              <div className="aspect-square relative">
                <Image 
                  src={att.url} 
                  alt={att.description || `Lampiran ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              
              {att.description && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-[1px] p-1">
                   <p className="text-[9px] text-white truncate text-center leading-none">{att.description}</p>
                </div>
              )}

              <button 
                type="button"
                onClick={() => onRemove(index)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-700 transition-colors z-10"
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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