'use client';

import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useRef } from 'react';

// --- 1. Konfigurasi Icon Leaflet ---
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

// --- 2. Komponen Logic GPS & Marker ---
function LocationMarker({ 
  onLocationSelect, 
  onStartLocate,
  onEndLocate,
  onError,
  initialLat,
  initialLng
}: { 
  onLocationSelect: (lat: number, lng: number) => void,
  onStartLocate: () => void,
  onEndLocate: () => void,
  onError: () => void,
  initialLat?: number,
  initialLng?: number
}) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
    locationfound(e) {
      onEndLocate();
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, 16);
    },
    locationerror(e) {
      onEndLocate();
      console.error("GPS Error:", e);
      onError();
    },
  });

  // Efek: Update posisi jika ada initialLat/Lng (misal dari tombol parent)
  useEffect(() => {
    if (initialLat && initialLng) {
      const newPos = new L.LatLng(initialLat, initialLng);
      setPosition(newPos);
      map.flyTo(newPos, 16);
    }
  }, [initialLat, initialLng, map]);

  // Custom Control: Tombol GPS & Manual di Peta
  useEffect(() => {
    const customControl = L.Control.extend({
      options: { position: 'bottomright' },
      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control flex flex-col gap-2');
        
        // Tombol GPS
        const btnGPS = L.DomUtil.create('button', 'bg-white p-2 cursor-pointer text-xs font-bold rounded border border-gray-300 shadow-sm hover:bg-gray-50 block w-full min-w-[100px]', container);
        btnGPS.innerHTML = '📍 Lokasi Saya';
        btnGPS.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation(); // Mencegah klik tembus ke peta
            onStartLocate();
            
            // Timeout guard: 8 detik
            setTimeout(() => {}, 8000); 

            map.locate({ 
                enableHighAccuracy: true,
                timeout: 8000
            }); 
        }

        // Tombol Manual
        const btnManual = L.DomUtil.create('button', 'bg-white p-2 cursor-pointer text-xs font-bold rounded border border-gray-300 shadow-sm hover:bg-gray-50 block w-full mt-1 text-gray-500', container);
        btnManual.innerHTML = '👆 Pilih Manual';
        btnManual.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          map.stopLocate();
          onEndLocate();
        }

        return container;
      },
    });
    
    const controlInstance = new customControl();
    map.addControl(controlInstance);

    return () => {
      map.removeControl(controlInstance);
    };
  }, [map, onStartLocate, onEndLocate]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Lokasi Terpilih</Popup>
    </Marker>
  );
}

// --- 3. Modal Tutorial & Fallback (High Z-Index) ---
function PermissionHelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    // PERBAIKAN: z-[9999] agar di atas layer peta Leaflet
    <div className="absolute inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center animate-fadeIn border border-gray-100 relative">
        
        {/* Tombol Close (X) di Pojok Kanan Atas */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          aria-label="Tutup"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="w-8 h-8 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        
        <p className="text-xs text-gray-500 mb-1 leading-relaxed">
            Browser tidak memberikan akses GPS. Mohon izinkan akses atau pilih lokasi secara manual.
        </p>

        {/* Tutorial Kecil */}
        <div className="bg-gray-50 rounded-xl p-1 text-left mb-1 border border-gray-100 opacity-80">
          <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Tips Safari (iOS):</p>
          <ol className="text-[10px] text-gray-500 space-y-1 list-decimal pl-4">
            <li>Ketuk ikon <span className="font-bold">"Aa"</span> di address bar.</li>
            <li>Pilih <span className="font-bold">Website Settings</span>.</li>
            <li>Ubah Location jadi <span className="font-bold text-green-600">Allow</span>.</li>
          </ol>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-3 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-transform hover:-translate-y-0.5 shadow-lg shadow-red-200"
        >
          Pilih Manual di Peta
        </button>
      </div>
    </div>
  );
}

// --- 4. Komponen Utama ---
export default function LocationPicker({ onLocationSelect, initialLat, initialLng }: LocationPickerProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleStartLocate = () => {
    setIsLocating(true);
    setShowHelp(false);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Fallback: Jika dalam 8 detik masih loading (GPS macet), stop dan munculkan modal
    timeoutRef.current = setTimeout(() => {
        if (isLocating) {
            setIsLocating(false);
            setShowHelp(true);
        }
    }, 8000);
  };

  const handleEndLocate = () => {
    setIsLocating(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  return (
    <div className="relative w-full h-full z-0 group overflow-hidden rounded-xl bg-gray-100">
      
      <PermissionHelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Loading Overlay - z-index diset tinggi tapi dibawah modal */}
      {isLocating && (
        <div className="absolute inset-0 z-[5000] bg-white/60 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
            <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse border border-red-100">
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-bold text-gray-600">Mencari koordinat...</span>
            </div>
        </div>
      )}

      <MapContainer 
        center={[-6.200000, 106.816666]} 
        zoom={13} 
        scrollWheelZoom={true} 
        className="h-full w-full z-0"
        style={{ height: '100%', minHeight: '300px' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker 
            onLocationSelect={onLocationSelect} 
            onStartLocate={handleStartLocate}
            onEndLocate={handleEndLocate}
            onError={() => {
                handleEndLocate();
                setShowHelp(true);
            }}
            initialLat={initialLat}
            initialLng={initialLng}
        />
      </MapContainer>
      
      {/* Instruksi Statis */}
      {!showHelp && !isLocating && (
        <div className="absolute top-3 right-3 z-[400] pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md text-[10px] font-semibold text-gray-600 border border-gray-200/50">
                Ketuk dan pin akan tertitik di lokasi
            </div>
        </div>
      )}
    </div>
  );
}