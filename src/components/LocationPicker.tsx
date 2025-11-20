// src/components/LocationPicker.tsx
'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// Fix icon marker leaflet yang hilang di Next.js
const icon = L.icon({
  iconUrl: '/icons/marker-icon.png', // Kita pakai icon default leaflet atau custom
  iconRetinaUrl: '/icons/marker-icon-2x.png',
  shadowUrl: '/icons/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Workaround agar gambar marker muncul (pakai CDN leaflet jika file lokal tidak ada)
L.Marker.prototype.options.icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

function LocationMarker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(null);

  // Event saat peta diklik
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
    // Otomatis deteksi lokasi saat pertama buka
    locationfound(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  // Trigger locate saat pertama render
  const map = useMapEvents({});
  useEffect(() => {
    map.locate();
  }, [map]);

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function LocationPicker({ onLocationSelect }: LocationPickerProps) {
  return (
    <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300 z-0 relative">
      <MapContainer 
        center={[-6.200000, 106.816666]} // Default Jakarta
        zoom={13} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onLocationSelect={onLocationSelect} />
      </MapContainer>
      <div className="absolute bottom-2 left-2 bg-white px-2 py-1 text-xs rounded shadow z-[1000] opacity-80 pointer-events-none">
        Klik peta untuk set lokasi
      </div>
    </div>
  );
}