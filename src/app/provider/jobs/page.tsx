// src/app/provider/jobs/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { fetchIncomingOrders } from '@/features/orders/api';

interface Order {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    phoneNumber?: string;
  };
  items: any[];
  totalAmount: number;
  status: string;
  scheduledAt?: string;
}

export default function ProviderJobsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true);
        const res = await fetchIncomingOrders();
        setOrders(res.data || []);
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Pekerjaan Masuk ({orders.length})</h1>

        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 font-medium">Belum ada pekerjaan masuk</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: Order) => (
              <div key={order._id} className="p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{order.userId?.fullName}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {order.items?.length || 0} item • Rp {(order.totalAmount / 1000000).toFixed(1)}jt
                    </p>
                    {order.scheduledAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        📅 {new Date(order.scheduledAt).toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>
                  <button className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap">
                    Terima Pekerjaan
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}