// src/features/providers/components/ProviderServicesContent.tsx

import Link from 'next/link';
import { Provider } from '../types';
import { ServiceItem } from './types';
import { formatCurrency, formatDuration } from './utils';
import { ClockIcon, CheckIcon, ServiceIcon } from './Icons';
import { getUnitLabel } from '@/features/services/types';

interface ProviderServicesContentProps {
  provider: Provider;
  onSelectService: (service: ServiceItem) => void;
}

export default function ProviderServicesContent({ provider, onSelectService }: ProviderServicesContentProps) {
  const activeServices = (provider.services as ServiceItem[]).filter((s) => s.isActive);

  if (activeServices.length === 0) {
    // Empty State: Padding dikurangi agar lebih compact (py-12 -> py-8)
    return (
      <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-gray-200">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <ServiceIcon className="w-5 h-5 text-gray-500"/>
        </div>
        <p className="text-gray-500 text-xs">Mitra ini belum memiliki layanan aktif.</p>
      </div>
    );
  }

  return (
    // Mengubah dari Grid menjadi List (flex-col)
    <div className="flex flex-col gap-3">
      {activeServices.map((item) => {
        const service = item.serviceId;
        const unitDisplay = service.displayUnit || service.unitLabel || getUnitLabel((service.unit as any) || 'unit');
        const durationText = formatDuration(service.estimatedDuration);
        const hasDetails =
          (service.includes && service.includes.length > 0) ||
          (service.excludes && service.excludes.length > 0) ||
          (service.requirements && service.requirements.length > 0);

        return (
          <div
            key={service._id}
            // LIST ITEM CONTAINER: Padding p-4 -> p-3. Rounded-2xl -> rounded-xl. Shadow lebih halus
            className="relative flex items-start p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-red-200 hover:shadow-md transition-all group"
          >
            {/* Badge Promo: Tetap ringkas */}
            {service.isPromo && service.discountPercent && service.discountPercent > 0 && (
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md z-10">
                -{service.discountPercent}%
              </div>
            )}

            {/* Icon KIRI: Compact w-10 h-10 */}
            <div className="w-10 h-10 shrink-0 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200 mr-3 group-hover:bg-red-50 group-hover:border-red-100 transition-colors">
              <img src={service.iconUrl || '/file.svg'} alt="Icon" className="w-5 h-5 object-contain opacity-70" />
            </div>

            {/* CONTENT UTAMA (Nama, Deskripsi, Badge) */}
            <div className="flex-1 min-w-0">
              {/* Header: Nama dan Kategori (text-sm & text-[10px]) */}
              <h4 className="font-bold text-gray-900 text-sm group-hover:text-red-600 transition-colors leading-tight truncate">
                {service.name}
              </h4>
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mt-0.5 mb-1">
                {service.category}
              </p>

              {/* Short Description: text-xs line-clamp-1 */}
              {service.shortDescription && (
                <p className="text-xs text-gray-500 mb-2 line-clamp-1">{service.shortDescription}</p>
              )}

              {/* Info Badges (Sangat Compact) */}
              <div className="flex items-center gap-2 flex-wrap">
                {durationText && (
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-full">
                    <ClockIcon className="w-3 h-3" />
                    <span>{durationText}</span>
                  </div>
                )}
                {service.includes && service.includes.length > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                    <CheckIcon className="w-3 h-3" />
                    <span>{service.includes.length} termasuk</span>
                  </div>
                )}
              </div>
            </div>

            {/* PRICE & ACTION KANAN (Shrink) */}
            <div className="flex flex-col items-end justify-between ml-3 shrink-0 h-full pt-1">
              <div>
                {/* Price: text-lg -> text-base (ringkas) */}
                <p className="font-black text-gray-900 text-base leading-none text-right">
                  {formatCurrency(item.price)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 text-right">/ {unitDisplay}</p>
              </div>

              {/* Button Action */}
              <div className="flex items-center gap-1 mt-3">
                {hasDetails && (
                  <button
                    onClick={() => onSelectService(item)}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline px-1 py-0.5"
                  >
                    Detail
                  </button>
                )}
                {/* Tombol PILIH: Lebih kecil dan ringkas. text-[10px] */}
                <Link
                  href={`/checkout?type=direct&providerId=${provider._id}`}
                  className="text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded-md transition-colors"
                >
                  Pilih
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}