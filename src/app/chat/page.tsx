// src/app/chat/page.tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import Image from 'next/image';

interface ChatRoom {
  _id: string;
  participants: Array<{ _id: string; fullName: string; profilePictureUrl?: string }>;
  messages: any[];
  updatedAt?: string;
}

export default function ChatPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // PERBAIKAN: useEffect tanpa dependencies issue
  useEffect(() => {
    const loadRooms = async () => {
      try {
        setIsLoading(true);
        // PERBAIKAN: fetchMyOrders tidak perlu parameter
        const res = await api.get('/chat');
        setRooms(res.data. data || []);
      } catch (error) {
        console.error('Error loading chat rooms:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRooms();
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
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Pesan</h1>

        {rooms.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
            </svg>
            <p className="text-gray-500 font-medium">Belum ada chat</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rooms.map((room: ChatRoom) => {
              const lastMessage = room.messages[room.messages.length - 1];
              const participant = room.participants[0];
              
              return (
                <div
                  key={room._id}
                  className="p-4 bg-white rounded-lg border border-gray-100 hover:border-red-200 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{participant?. fullName}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {lastMessage?.content || 'Tidak ada pesan'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}