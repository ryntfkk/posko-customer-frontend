// src/components/ProviderHome.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { fetchMyProviderProfile, updateAvailability } from '@/features/providers/api';
import { fetchIncomingOrders } from '@/features/orders/api';
import { Provider } from '@/features/auth/types';

interface ScheduleDay {
  dayIndex: number;
  dayName: string;
  isOpen: boolean;
  start: string;
  end: string;
}

interface ProviderHomeProps {
  userProfile: any;
}

export default function ProviderHome({ userProfile }: ProviderHomeProps) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoadingProvider, setIsLoadingProvider] = useState(true);
  const [incomingOrders, setIncomingOrders] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  // =====================================================================
  // EFFECT 1: Load Provider Profile
  // =====================================================================
  useEffect(() => {
    const loadProvider = async () => {
      try {
        setIsLoadingProvider(true);
        const res = await fetchMyProviderProfile();
        setProvider(res.data);
      } catch (error) {
        console.error('Error loading provider:', error);
      } finally {
        setIsLoadingProvider(false);
      }
    };

    loadProvider();
  }, []);

  // =====================================================================
  // EFFECT 2: Load Incoming Orders
  // =====================================================================
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await fetchIncomingOrders();
        setIncomingOrders(res.data || []);
      } catch (error) {
        console.error('Error loading orders:', error);
      }
    };

    loadOrders();
  }, []);

  // =====================================================================
  // HANDLERS
  // =====================================================================
  const handleAddScheduleDay = () => {
    setSchedule([
      ...schedule,
      {
        dayIndex: schedule.length,
        dayName: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][schedule.length],
        isOpen: true,
        start: '08:00',
        end: '17:00',
      },
    ]);
  };

  const handleUpdateScheduleDay = (index: number, field: string, value: any): void => {
    const updatedSchedule = [...schedule];
    updatedSchedule[index] = { ...updatedSchedule[index], [field]: value };
    setSchedule(updatedSchedule);
  };

  const handleAddBlockedDate = () => {
    const today = new Date().toISOString().split('T')[0];
    setBlockedDates([...blockedDates, today]);
  };

  const handleRemoveBlockedDate = (index: number): void => {
    setBlockedDates(blockedDates.filter((_, i) => i !== index));
  };

  const handleSaveAvailability = async () => {
    try {
      const payload = {
        schedule,
        blockedDates: blockedDates.map((d: string) => new Date(d)),
      };
      await updateAvailability(payload);
      alert('Jadwal ketersediaan berhasil diperbarui!');
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Gagal memperbarui jadwal.');
    }
  };

  if (isLoadingProvider) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="p-6 text-center bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-700">Profil provider tidak ditemukan. </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Provider Profile */}
      <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Profil Mitra</h2>
        <div className="flex items-start gap-4">
          <Image
            src={userProfile.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.fullName}`}
            alt={userProfile. fullName}
            width={80}
            height={80}
            className="w-20 h-20 rounded-full object-cover"
          />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{userProfile.fullName}</h3>
            <p className="text-sm text-gray-600 mt-2">{userProfile.bio}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm text-yellow-500">★</span>
              <span className="text-sm font-bold text-gray-700">{provider.rating ? provider.rating. toFixed(1) : 'New'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Incoming Orders */}
      <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Pesanan Masuk ({incomingOrders.length})</h2>
        {incomingOrders.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Belum ada pesanan masuk</p>
        ) : (
          <div className="space-y-3">
            {incomingOrders.map((order: any) => (
              <div key={order._id} className="p-4 border border-gray-200 rounded-lg hover:border-red-200 hover:bg-red-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{order.userId?.fullName}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {order.items?.length || 0} item • {order.totalAmount ? `Rp ${(order.totalAmount / 1000000).toFixed(1)}jt` : 'N/A'}
                    </p>
                    {order.scheduledAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Jadwal: {new Date(order. scheduledAt).toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>
                  <button className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap">
                    Terima
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Availability Management */}
      <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Jadwal Ketersediaan</h2>

        {/* Schedule Days */}
        <div className="space-y-3 mb-6">
          {schedule.map((day: ScheduleDay, index: number) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={day.isOpen}
                      onChange={(e) => handleUpdateScheduleDay(index, 'isOpen', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="font-semibold text-gray-900">{day.dayName}</span>
                  </label>
                  {day.isOpen && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="time"
                        value={day. start}
                        onChange={(e) => handleUpdateScheduleDay(index, 'start', e. target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <span className="text-gray-600">-</span>
                      <input
                        type="time"
                        value={day.end}
                        onChange={(e) => handleUpdateScheduleDay(index, 'end', e.target. value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleAddScheduleDay}
          className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 font-bold rounded-lg hover:border-red-600 hover:text-red-600 transition-colors mb-6"
        >
          + Tambah Hari
        </button>

        {/* Blocked Dates */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-bold text-gray-900 mb-3">Tanggal Libur Manual</h3>
          <div className="space-y-2 mb-4">
            {blockedDates.map((date: string, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm text-gray-700">{new Date(date).toLocaleDateString('id-ID')}</span>
                <button
                  onClick={() => handleRemoveBlockedDate(index)}
                  className="text-red-600 hover:text-red-700 font-bold text-sm"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddBlockedDate}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 font-bold rounded-lg hover:border-red-600 hover:text-red-600 transition-colors"
          >
            + Tambah Tanggal Libur
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveAvailability}
          className="w-full mt-6 px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
        >
          Simpan Jadwal
        </button>
      </section>
    </div>
  );
}