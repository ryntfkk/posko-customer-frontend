// src/app/chat/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/axios';
import { fetchProfile } from '@/features/auth/api';
import { User } from '@/features/auth/types';

// --- CONSTANTS ---
// [OPTIMASI] Pindahkan URL ke luar komponen agar statis
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

// --- ICONS ---
const BackIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>;
const SendIcon = () => <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

// --- TYPES ---
interface ChatUser { _id: string; fullName: string; profilePictureUrl: string; }
interface Message { _id: string; content: string; sender: string | { _id: string, fullName: string }; sentAt: string; }
interface ChatRoom { _id: string; participants: ChatUser[]; messages: Message[]; updatedAt: string; }

export default function ChatPage() {
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper untuk mendapatkan ID User yang benar
  const myId = user ? ((user as any)._id || user.userId) : null;

  const getSenderId = (sender: string | { _id: string }) => {
    return typeof sender === 'object' ? sender._id : sender;
  };

  useEffect(() => {
    const initChat = async () => {
      const token = localStorage.getItem('posko_token');
      if (!token) { router.push('/login'); return; }

      try {
        const profileRes = await fetchProfile();
        setUser(profileRes.data.profile);

        const chatRes = await api.get('/chat');
        setRooms(chatRes.data.data);

        const newSocket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });

        newSocket.on('receive_message', (data: { roomId: string, message: Message }) => {
          setRooms(prev => {
            const roomIndex = prev.findIndex(r => r._id === data.roomId);
            if (roomIndex === -1) return prev;
            const updatedRoom = { 
               ...prev[roomIndex], 
               messages: [...prev[roomIndex].messages, data.message],
               updatedAt: new Date().toISOString()
            };
            const newRooms = [...prev];
            newRooms.splice(roomIndex, 1);
            newRooms.unshift(updatedRoom);
            return newRooms;
          });

          setActiveRoom(current => {
            if (current && current._id === data.roomId) {
              return { ...current, messages: [...current.messages, data.message] };
            }
            return current;
          });
        });

        setSocket(newSocket);
      } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    initChat();
    return () => { socket?.disconnect(); };
    // [FIX] Hapus SOCKET_URL dari dependency array karena sekarang dia constant di luar komponen
    // router aman dimasukkan, atau biarkan kosong jika linter complain
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeRoom?.messages]);

  const getOpponent = (room: ChatRoom) => {
    if (!myId) return null;
    return room.participants.find(p => p._id !== myId) || room.participants[0];
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom || !socket) return;
    socket.emit('send_message', { roomId: activeRoom._id, content: newMessage });
    setNewMessage('');
  };

  const openRoom = async (room: ChatRoom) => {
    try {
        const res = await api.get(`/chat/${room._id}`);
        setActiveRoom(res.data.data);
        socket?.emit('join_chat', room._id);
    } catch (error) { console.error(error); }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-white text-sm text-gray-500">Memuat...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col md:flex-row max-w-7xl mx-auto overflow-hidden md:my-8 md:rounded-2xl border-gray-200 md:border md:h-[800px]">
      
      {/* LIST ROOMS */}
      <div className={`w-full md:w-1/3 bg-white flex flex-col ${activeRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="md:hidden text-gray-600"><BackIcon /></button>
                <h1 className="text-xl font-bold text-gray-900">Pesan</h1>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                {user && <Image src={user.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.fullName}`} alt="Me" width={32} height={32} className="object-cover" />}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {rooms.map(room => {
                const opponent = getOpponent(room);
                const lastMsg = room.messages[room.messages.length - 1];
                const isActive = activeRoom?._id === room._id;
                return (
                    <button key={room._id} onClick={() => openRoom(room)} className={`w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-all text-left border-b border-gray-50 ${isActive ? 'bg-red-50' : ''}`}>
                        <div className="relative w-12 h-12 shrink-0">
                            <div className="w-full h-full rounded-full bg-gray-200 overflow-hidden border border-gray-100">
                                <Image src={opponent?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${opponent?.fullName}`} alt="User" width={48} height={48} className="object-cover" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <h4 className={`text-sm font-bold truncate ${isActive ? 'text-red-700' : 'text-gray-900'}`}>{opponent?.fullName}</h4>
                                <span className="text-[10px] text-gray-400">{lastMsg ? new Date(lastMsg.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                            </div>
                            <p className={`text-xs truncate ${isActive ? 'text-red-600/70' : 'text-gray-500'}`}>
                                {lastMsg ? (
                                    getSenderId(lastMsg.sender) === myId ? `Anda: ${lastMsg.content}` : lastMsg.content
                                ) : <span className="italic opacity-60">Mulai obrolan baru...</span>}
                            </p>
                        </div>
                    </button>
                );
            })}
        </div>
      </div>

      {/* DETAIL CHAT */}
      <div className={`w-full md:w-2/3 bg-gray-50 flex-col ${activeRoom ? 'flex' : 'hidden md:flex'} relative`}>
        {activeRoom ? (
            <>
                <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
                    <button onClick={() => setActiveRoom(null)} className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><BackIcon /></button>
                    <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden border border-gray-200">
                        <Image src={getOpponent(activeRoom)?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${getOpponent(activeRoom)?.fullName}`} alt="User" width={36} height={36} className="object-cover" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm text-gray-900">{getOpponent(activeRoom)?.fullName}</span>
                        <span className="text-[10px] text-green-600 font-medium">Online</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f0f2f5] md:bg-white">
                    {activeRoom.messages.map((msg, idx) => {
                        const senderId = getSenderId(msg.sender);
                        const isMe = senderId === myId;

                        return (
                            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] md:max-w-[60%] px-4 py-2.5 rounded-2xl text-sm shadow-sm break-words ${
                                    isMe ? 'bg-red-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
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

                <div className="p-3 bg-white border-t border-gray-200 sticky bottom-0 z-20">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-3xl mx-auto">
                        <input 
                            type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Ketik pesan..." 
                            className="flex-1 bg-gray-100 text-gray-900 border-none rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:bg-white transition-all outline-none"
                        />
                        <button type="submit" disabled={!newMessage.trim()} className="w-11 h-11 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 shadow-md transition-all disabled:bg-gray-200">
                            <SendIcon />
                        </button>
                    </form>
                </div>
            </>
        ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-300 bg-gray-50"><p>Pilih percakapan untuk memulai</p></div>
        )}
      </div>
    </div>
  );
}