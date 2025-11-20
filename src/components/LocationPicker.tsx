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
}

// --- 2. Komponen Logic GPS & Marker ---
function LocationMarker({ 
  onLocationSelect, 
  onStartLocate,
  onEndLocate,
  onError 
}: { 
  onLocationSelect: (lat: number, lng: number) => void,
  onStartLocate: () => void,
  onEndLocate: () => void,
  onError: () => void 
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

  // Custom Control: Tombol GPS & Manual
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
            onStartLocate();
            // Guard: Jika 8 detik macet, anggap error
            setTimeout(() => {
               // Logic timeout ditangani di parent state, tapi ini trigger event leafet
            }, 8000); 

            map.locate({ 
                enableHighAccuracy: true,
                timeout: 8000
            }); 
        }

        // Tombol Manual (Langsung stop GPS)
        const btnManual = L.DomUtil.create('button', 'bg-white p-2 cursor-pointer text-xs font-bold rounded border border-gray-300 shadow-sm hover:bg-gray-50 block w-full mt-1 text-gray-500', container);
        btnManual.innerHTML = '👆 Pilih Manual';
        btnManual.onclick = function(e) {
          e.preventDefault();
          map.stopLocate();
          onEndLocate();
        }

        return container;
      },
    });
    
    const controlInstance = new customControl();
    map.addControl(controlInstance);

    // Auto-locate saat pertama kali buka (opsional)
    onStartLocate();
    map.locate({ setView: true, maxZoom: 16, timeout: 8000 });

    return () => {
      map.removeControl(controlInstance);
    };
  }, [map]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Lokasi Terpilih</Popup>
    </Marker>
  );
}

// --- 3. Modal Tutorial & Fallback (Tanpa Refresh) ---
function PermissionHelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center animate-fadeIn border border-gray-100">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        
        <h3 className="text-base font-bold text-gray-900 mb-2">Gagal Mendeteksi Lokasi</h3>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Browser tidak memberikan akses GPS. Silakan tandai lokasi rumah Anda secara manual di peta.
        </p>

        {/* Tutorial Kecil (Hanya Info) */}
        <div className="bg-gray-50 rounded-xl p-3 text-left mb-5 border border-gray-100 opacity-70 hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Info: Cara aktifkan di Safari</p>
          <ol className="text-[10px] text-gray-500 space-y-1 list-decimal pl-4">
            <li>Klik ikon <span className="font-bold">"Aa"</span> di address bar.</li>
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
export default function LocationPicker({ onLocationSelect }: LocationPickerProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleStartLocate = () => {
    setIsLocating(true);
    setShowHelp(false);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Fallback jika GPS 'hang' (umum di iOS Safari yg permissionnya 'Ask')
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

      {/* Loading Overlay */}
      {isLocating && (
        <div className="absolute inset-0 z-[900] bg-white/60 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
            <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
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
        />
      </MapContainer>
      
      {/* Instruksi Statis */}
      {!showHelp && !isLocating && (
        <div className="absolute top-3 right-3 z-[400] pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md text-[10px] font-semibold text-gray-600 border border-gray-200/50">
                Geser pin merah ke lokasi rumah
            </div>
        </div>
      )}
    </div>
  );
}