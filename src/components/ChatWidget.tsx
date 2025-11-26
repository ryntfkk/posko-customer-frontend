// src/components/ChatWidget.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/axios';
import Image from 'next/image';

interface Message {
  _id?: string;
  sender: string | { _id: string; fullName: string; profilePictureUrl?: string };
  content: string;
  createdAt?: string;
}

interface ChatRoom {
  _id: string;
  participants: Array<{ _id: string; fullName: string; profilePictureUrl?: string }>;
  messages: Message[];
  updatedAt?: string;
}

interface ChatWidgetUser {
  _id: string;
  userId?: string;
  fullName: string;
  profilePictureUrl?: string;
}

interface ChatWidgetProps {
  user: ChatWidgetUser | null;
}

export default function ChatWidget({ user }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isUnread, setIsUnread] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const SOCKET_URL = 'https://posko-backend.vercel.app';

  // PERBAIKAN: Proper optional chaining
  const myId: string = user? ._id || localStorage.getItem('userId') || '';

  useEffect(() => {
    if (! user || !myId) return;

    const token = localStorage.getItem('posko_token');
    if (!token) return;

    const initializeChat = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/chat');
        setRooms(res.data.data || []);

        const newSocket = io(SOCKET_URL, {
          auth: { token },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        newSocket.on('connect', () => {
          console.log('✅ Socket connected:', newSocket.id);
        });

        newSocket.on('receive_message', (data: { roomId: string; message: Message }) => {
          setRooms((prev) => {
            const roomIndex = prev.findIndex((r) => r._id === data. roomId);
            if (roomIndex === -1) return prev;

            const updatedRoom = {
              ...prev[roomIndex],
              messages: [...prev[roomIndex].messages, data.message],
              updatedAt: new Date().toISOString(),
            };
            
            const newRooms = [... prev];
            newRooms.splice(roomIndex, 1);
            newRooms.unshift(updatedRoom);
            return newRooms;
          });

          setActiveRoom((current) => {
            if (current && current._id === data.roomId) {
              return {
                ...current,
                messages: [...current.messages, data. message],
              };
            }
            if (!current || current._id !== data.roomId) {
              setIsUnread(true);
            }
            return current;
          });
        });

        newSocket. on('disconnect', () => {
          console.log('❌ Socket disconnected');
        });

        newSocket.on('error', (error: any) => {
          console.error('Socket error:', error);
        });

        setSocket(newSocket);
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();

    return () => {
      if (socket) {
        socket. disconnect();
      }
    };
  }, [user, myId]);

  useEffect(() => {
    if (isOpen && activeRoom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setIsUnread(false);
    }
  }, [activeRoom?. messages, isOpen, activeRoom]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (! newMessage.trim() || !activeRoom || !socket) return;

    socket.emit('send_message', {
      roomId: activeRoom._id,
      content: newMessage,
    });
    
    setNewMessage('');
  };

  const openRoom = async (room: ChatRoom) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/chat/${room._id}`);
      const detailRoom = res.data.data;
      setActiveRoom(detailRoom);
      
      if (socket) {
        socket.emit('join_chat', room._id);
      }
    } catch (error) {
      console.error('Error opening room:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getOpponent = (room: ChatRoom): any => {
    if (!myId) return room.participants[0];
    return room.participants.find((p) => p._id !== myId) || room.participants[0];
  };

  const getSenderId = (sender: string | { _id: string }): string => {
    return typeof sender === 'object' ? sender._id : sender;
  };

  const getSenderName = (sender: string | { _id: string; fullName?: string }): string => {
    if (typeof sender === 'object' && sender.fullName) {
      return sender.fullName;
    }
    return 'User';
  };

  const getSenderAvatar = (sender: string | { _id: string; profilePictureUrl?: string }): string => {
    if (typeof sender === 'object' && sender.profilePictureUrl) {
      return sender.profilePictureUrl;
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`;
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-40 w-16 h-16 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center hover:scale-110"
      >
        {isUnread && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full animate-pulse" />
        )}
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
          <path d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14. 057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-8 z-40 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
            <h2 className="font-bold text-lg">Pesan</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-700 p-1 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4. 293 4.293a1 1 0 01-1. 414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Rooms List / Messages */}
          <div className="flex-1 overflow-y-auto">
            {!activeRoom ? (
              <div className="space-y-2 p-4">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                ) : rooms.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Belum ada chat</p>
                ) : (
                  rooms.map((room) => {
                    const opponent = getOpponent(room);
                    const lastMessage = room.messages[room.messages.length - 1];
                    
                    return (
                      <button
                        key={room._id}
                        onClick={() => openRoom(room)}
                        className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left border border-transparent hover:border-gray-200"
                      >
                        <Image
                          src={opponent?.profilePictureUrl || `https://api.dicebear. com/7.x/avataaars/svg?seed=${opponent?.fullName || 'user'}`}
                          alt={opponent?.fullName || 'User'}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{opponent?.fullName}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {lastMessage?.content || 'Tidak ada pesan'}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="flex flex-col p-4 space-y-3">
                {activeRoom.messages.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Mulai percakapan</p>
                ) : (
                  activeRoom.messages.map((msg, idx) => {
                    const senderId = getSenderId(msg. sender);
                    const senderName = getSenderName(msg.sender);
                    const senderAvatar = getSenderAvatar(msg.sender);
                    const isFromMe = myId ? senderId === myId : false;

                    return (
                      <div
                        key={idx}
                        className={`flex gap-2 ${isFromMe ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <Image
                          src={senderAvatar}
                          alt={senderName}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className={`flex flex-col ${isFromMe ? 'items-end' : 'items-start'}`}>
                          <p className="text-xs text-gray-500 mb-1">{senderName}</p>
                          <div
                            className={`px-3 py-2 rounded-lg text-sm ${
                              isFromMe
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          {activeRoom && (
            <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ketik pesan..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-2.976 5.951 2.976a1 1 0 001. 169-1.409l-7-14z" />
                </svg>
              </button>
            </form>
          )}

          {/* Back Button */}
          {activeRoom && (
            <button
              onClick={() => setActiveRoom(null)}
              className="border-t border-gray-200 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-gray-50 transition-colors"
            >
              ← Kembali ke Daftar Chat
            </button>
          )}
        </div>
      )}
    </>
  );
}