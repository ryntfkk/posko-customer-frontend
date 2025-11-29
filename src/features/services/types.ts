export type ServiceUnit = 'unit' | 'jam' | 'hari' | 'meter' | 'kg' | 'paket' | 'orang' | 'ruangan' | 'kendaraan';

export interface Service {
  _id: string;
  name: string;
  category: string;
  iconUrl: string;
  basePrice: number;
  unit: ServiceUnit;        // ✅ [BARU]
  unitLabel?: string;       // ✅ [BARU] Label kustom (opsional)
  displayUnit: string;      // ✅ [BARU] Virtual dari backend
  description: string;
  isActive: boolean;
}

export interface ServiceResponse {
  message: string;
  data: Service[];
}

// Helper function untuk mendapatkan label satuan
export function getUnitLabel(unit: ServiceUnit, customLabel?: string): string {
  if (customLabel) return customLabel;
  
  const labels: Record<ServiceUnit, string> = {
    'unit': 'per unit',
    'jam': 'per jam',
    'hari': 'per hari',
    'meter': 'per meter',
    'kg': 'per kg',
    'paket': 'per paket',
    'orang': 'per orang',
    'ruangan': 'per ruangan',
    'kendaraan': 'per kendaraan'
  };
  
  return labels[unit] || 'per unit';
}

// Helper untuk mendapatkan label quantity
export function getQuantityLabel(unit: ServiceUnit): string {
  const labels: Record<ServiceUnit, string> = {
    'unit': 'Unit',
    'jam': 'Jam',
    'hari': 'Hari',
    'meter': 'Meter',
    'kg': 'Kg',
    'paket': 'Paket',
    'orang': 'Orang',
    'ruangan': 'Ruangan',
    'kendaraan': 'Kendaraan'
  };
  
  return labels[unit] || 'Unit';
}