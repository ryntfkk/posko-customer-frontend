// src/app/chat/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/axios';
import { fetchProfile } from '@/features/auth/api';
import { User } from '@/features/auth/types';

// --- ICONS ---
const BackIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>;
const SendIcon = () => <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

// --- TYPES (Sama dengan ChatWidget) ---
interface ChatUser {
  _id: string;
  fullName: string;
  profilePictureUrl: string;
}

interface Message {
  _id: string;
  content: string;
  sender: string | { _id: string, fullName: string };
  sentAt: string;
}

interface ChatRoom {
  _id: string;
  participants: ChatUser[];
  messages: Message[];
  updatedAt: string;
}

export default function ChatPage() {
  const router = useRouter();
  
  // State User & Data
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // State Socket & Pesan
  const [socket, setSocket] = useState<Socket | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

  // 1. Load Profil & Init Socket
  useEffect(() => {
    const initChat = async () => {
      const token = localStorage.getItem('posko_token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // A. Ambil Profil User
        const profileRes = await fetchProfile();
        setUser(profileRes.data.profile);

        // B. Ambil Daftar Chat
        const chatRes = await api.get('/chat');
        setRooms(chatRes.data.data);

        // C. Koneksi Socket
        const newSocket = io(SOCKET_URL, {
          auth: { token },
          transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => console.log('✅ Mobile Chat Connected'));

        // Listener Pesan Masuk
        newSocket.on('receive_message', (data: { roomId: string, message: Message }) => {
          setRooms(prev => prev.map(room => {
            if (room._id === data.roomId) {
               const updatedMsgs = [...room.messages, data.message];
               return { ...room, messages: updatedMsgs, updatedAt: new Date().toISOString() };
            }
            return room;
          }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));

          setActiveRoom(current => {
            if (current && current._id === data.roomId) {
              return { ...current, messages: [...current.messages, data.message] };
            }
            return current;
          });
        });

        setSocket(newSocket);
      } catch (error) {
        console.error("Gagal memuat chat:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();

    return () => {
      socket?.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // Hapus dependencies socket agar tidak reconnect terus

  // Auto Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeRoom?.messages]);

  // Logic Helpers
  const getOpponent = (room: ChatRoom) => {
    if (!user) return null;
    return room.participants.find(p => p._id !== user.userId) || room.participants[0];
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom || !socket) return;

    socket.emit('send_message', {
      roomId: activeRoom._id,
      content: newMessage
    });
    setNewMessage('');
  };

  const openRoom = (room: ChatRoom) => {
    setActiveRoom(room);
    socket?.emit('join_chat', room._id);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-white text-sm text-gray-500">Memuat obrolan...</div>;
  }

  // --- TAMPILAN UTAMA ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col md:flex-row max-w-7xl mx-auto overflow-hidden shadow-xl md:my-8 md:rounded-2xl border-gray-200 md:border md:h-[800px]">
      
      {/* --- KOLOM KIRI: DAFTAR CHAT --- */}
      {/* Di Mobile: Sembunyikan jika sedang buka room */}
      <div className={`w-full md:w-1/3 bg-white flex flex-col ${activeRoom ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header List */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="md:hidden text-gray-600">
                    <BackIcon />
                </button>
                <h1 className="text-xl font-bold text-gray-900">Pesan</h1>
            </div>
            {/* Foto Profil Sendiri */}
            <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                {user && <img src={user.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.fullName}`} alt="Me" className="w-full h-full object-cover" />}
            </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2">
            <div className="relative">
                <input type="text" placeholder="Cari pesan..." className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all" />
                <div className="absolute left-3 top-2.5"><SearchIcon /></div>
            </div>
        </div>

        {/* List Rooms */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {rooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 p-6 text-center">
                    <p className="text-sm">Belum ada percakapan.</p>
                    <button onClick={() => router.push('/')} className="text-xs text-red-600 font-bold mt-2 hover:underline">Cari Jasa</button>
                </div>
            ) : (
                <div className="divide-y divide-gray-50">
                    {rooms.map(room => {
                        const opponent = getOpponent(room);
                        const lastMsg = room.messages[room.messages.length - 1];
                        const isActive = activeRoom?._id === room._id;

                        return (
                            <button 
                                key={room._id} 
                                onClick={() => openRoom(room)}
                                className={`w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-all text-left ${isActive ? 'bg-red-50/50' : ''}`}
                            >
                                <div className="relative w-12 h-12 shrink-0">
                                    <div className="w-full h-full rounded-full bg-gray-200 overflow-hidden border border-gray-100">
                                        <img src={opponent?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${opponent?.fullName}`} alt="User" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className={`text-sm font-bold truncate ${isActive ? 'text-red-700' : 'text-gray-900'}`}>{opponent?.fullName}</h4>
                                        <span className="text-[10px] text-gray-400">{lastMsg ? new Date(lastMsg.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                                    </div>
                                    <p className={`text-xs truncate ${isActive ? 'text-red-600/70' : 'text-gray-500'}`}>
                                        {lastMsg ? lastMsg.content : <span className="italic opacity-60">Mulai obrolan baru...</span>}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
      </div>

      {/* --- KOLOM KANAN: ISI CHAT --- */}
      {/* Di Mobile: Tampil hanya jika ada activeRoom */}
      <div className={`w-full md:w-2/3 bg-gray-50 flex-col ${activeRoom ? 'flex' : 'hidden md:flex'} relative`}>
        
        {activeRoom ? (
            <>
                {/* Header Chat */}
                <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
                    <button onClick={() => setActiveRoom(null)} className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
                        <BackIcon />
                    </button>
                    <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden border border-gray-200">
                        <img src={getOpponent(activeRoom)?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${getOpponent(activeRoom)?.fullName}`} alt="User" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm text-gray-900">{getOpponent(activeRoom)?.fullName}</span>
                        <span className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
                        </span>
                    </div>
                </div>

                {/* Bubbles Chat */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f0f2f5] md:bg-white">
                    {activeRoom.messages.length === 0 && (
                        <div className="text-center py-10 opacity-50">
                            <p className="text-xs text-gray-500">Mulai percakapan dengan {getOpponent(activeRoom)?.fullName}</p>
                        </div>
                    )}
                    
                    {activeRoom.messages.map((msg, idx) => {
                        const senderId = typeof msg.sender === 'string' ? msg.sender : msg.sender._id;
                        const isMe = senderId === user?.userId;

                        return (
                            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] md:max-w-[60%] px-4 py-2.5 rounded-2xl text-sm shadow-sm break-words ${
                                    isMe 
                                    ? 'bg-red-600 text-white rounded-br-none' 
                                    : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                                }`}>
                                    {msg.content}
                                    <p className={`text-[9px] mt-1 text-right ${isMe ? 'text-red-100' : 'text-gray-400'}`}>
                                        {new Date(msg.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-white border-t border-gray-200 sticky bottom-0 z-20">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-3xl mx-auto">
                        <input 
                            type="text" 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Ketik pesan..." 
                            className="flex-1 bg-gray-100 text-gray-900 border-none rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:bg-white transition-all outline-none placeholder-gray-400"
                        />
                        <button 
                            type="submit" 
                            disabled={!newMessage.trim()} 
                            className="w-11 h-11 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 shadow-md shadow-red-100 transition-all active:scale-95 disabled:bg-gray-200 disabled:shadow-none disabled:cursor-not-allowed"
                        >
                            <SendIcon />
                        </button>
                    </form>
                </div>
            </>
        ) : (
            // State Desktop Kosong (Belum pilih chat)
            <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-300 bg-gray-50">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 opacity-30" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                </div>
                <p className="text-sm font-medium text-gray-400">Pilih percakapan untuk memulai</p>
            </div>
        )}
      </div>
    </div>
  );
}