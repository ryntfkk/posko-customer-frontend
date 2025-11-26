// src/app/orders/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchMyOrders } from '@/features/orders/api';

interface OrderItem {
  serviceId: {
    _id: string;
    name: string;
    category: string;
    iconUrl?: string;
  } | string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  orderType: 'direct' | 'basic';
  scheduledAt?: string;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true);
        const res = await fetchMyOrders();
        setOrders(res. data || []);
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders. filter(o => o.status === filter);

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-blue-100 text-blue-700',
      searching: 'bg-purple-100 text-purple-700',
      accepted: 'bg-blue-100 text-blue-700',
      on_the_way: 'bg-orange-100 text-orange-700',
      working: 'bg-orange-100 text-orange-700',
      waiting_approval: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      failed: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getServiceIcon = (item: OrderItem): string | undefined => {
    if (typeof item.serviceId === 'object') {
      return item.serviceId.iconUrl;
    }
    return undefined;
  };

  const getServiceName = (item: OrderItem): string => {
    if (typeof item.serviceId === 'object') {
      return item.serviceId.name;
    }
    return item.name;
  };

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
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Pesanan Saya</h1>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'pending', 'paid', 'searching', 'accepted', 'working', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                filter === status
                  ? 'bg-red-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              {status === 'all' ? 'Semua' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="text-gray-500 font-medium">Belum ada pesanan</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Link
                key={order._id}
                href={`/orders/${order._id}`}
                className="block p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:border-red-200 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeColor(order.status)}`}>
                        {order.status. toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(order.createdAt). toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {order.items?.length || 0} item • {order.orderType === 'direct' ? 'Direct Order' : 'Basic Order'}
                    </p>
                  </div>
                  <p className="text-xl font-black text-red-600">
                    Rp {(order.totalAmount / 1000000).toFixed(1)}jt
                  </p>
                </div>

                {/* Items */}
                <div className="flex gap-2 mb-3">
                  {order.items?.slice(0, 3).map((item, idx) => (
                    <div
                      key={idx}
                      className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                    >
                      {getServiceIcon(item) ? (
                        <Image
                          src={getServiceIcon(item)!}
                          alt={getServiceName(item)}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  ))}
                  {order.items && order.items.length > 3 && (
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-xs font-bold text-gray-700">
                      +{order. items.length - 3}
                    </div>
                  )}
                </div>

                {/* Scheduled Date */}
                {order.scheduledAt && (
                  <p className="text-xs text-gray-500">
                    📅 {new Date(order.scheduledAt).toLocaleString('id-ID')}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}