// src/components/ChatWidget.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Image from 'next/image'; // Import Image
import api from '@/lib/axios';

// --- ICONS ---
const ExpandIcon = () => <svg className="w-4 h-4 hover:text-gray-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const EditIcon = () => <svg className="w-5 h-5 group-hover:text-gray-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>;
const CloseIcon = () => <svg className="w-5 h-5 hover:text-gray-800 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>;
const SendIcon = () => <svg className="w-4 h-4 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const BackIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>;

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

export default function ChatWidget({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // URL API Backend (hapus /api jika ada, sesuaikan dengan port socket)
  const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

  // 1. Inisialisasi Socket
  useEffect(() => {
    const token = localStorage.getItem('posko_token');
    if (!token) return;

    // Load Rooms
    api.get('/chat').then(res => setRooms(res.data.data)).catch(console.error);

    // Connect Socket
    const newSocket = io(SOCKET_URL, {
      auth: { token }
    });

    newSocket.on('connect', () => console.log('Chat Connected'));
    
    newSocket.on('receive_message', (data: { roomId: string, message: Message }) => {
      // Update Room List
      setRooms(prev => prev.map(room => {
        if (room._id === data.roomId) {
           return { ...room, messages: [...room.messages, data.message] };
        }
        return room;
      }));

      // Update Active Room (Realtime Bubble)
      setActiveRoom(current => {
        if (current && current._id === data.roomId) {
          return { ...current, messages: [...current.messages, data.message] };
        }
        return current;
      });
    });

    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  }, [SOCKET_URL]);

  // Auto Scroll ke bawah
  useEffect(() => {
    if (isOpen && activeRoom) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeRoom?.messages, isOpen, activeRoom]);

  const handleSendMessage = async (e: React.FormEvent) => {
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

  const getOpponent = (room: ChatRoom) => {
    return room.participants.find(p => p._id !== user.userId) || room.participants[0];
  };

  const userAvatar = user.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.fullName)}`;

  // --- VIEW 1: CLOSED STATE (TOMBOL PERSEGI PANJANG di BAWAH) ---
  if (!isOpen) {
    return (
        <div className="fixed bottom-0 right-4 z-50 flex flex-col items-end font-sans">
            <button 
                onClick={() => setIsOpen(true)} 
                className="w-72 bg-white border border-gray-200 rounded-t-lg shadow-[0_-2px_10px_rgba(0,0,0,0.05)] hover:shadow-[0_-4px_15px_rgba(0,0,0,0.1)] px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-all duration-200 group"
            >
                <div className="flex items-center gap-2.5">
                    <div className="relative w-7 h-7 shrink-0">
                        <img src={userAvatar} alt="Profile" className="w-full h-full rounded-full border border-gray-200 object-cover" />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></span>
                    </div>
                    <span className="font-bold text-sm text-gray-700 group-hover:text-gray-900">Pesan</span>
                    {/* Badge Unread (Contoh Logic) */}
                    {/* {rooms.some(r => r.unread > 0) && <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">1</span>} */}
                </div>
                <div className="flex items-center gap-4 text-gray-400 pr-1">
                    <ExpandIcon />
                    <EditIcon />
                </div>
            </button>
        </div>
    );
  }

  // --- VIEW 2: OPEN STATE (WINDOW CHAT) ---
  return (
    <div className="fixed bottom-0 right-4 z-50 flex flex-col items-end font-sans">
        <div className="w-80 h-[500px] bg-white rounded-t-xl shadow-[0_0_20px_rgba(0,0,0,0.1)] border border-gray-200 flex flex-col animate-in slide-in-from-bottom-10 duration-200 ring-1 ring-black/5">
            
            {/* HEADER WINDOW */}
            <div 
                onClick={() => { if(!activeRoom) setIsOpen(false); }} // Klik header tutup jika di list, kalau di room tidak ngapa2in (opsional)
                className="px-3 py-2.5 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-xl transition-colors"
            >
                <div className="flex items-center gap-2">
                    {activeRoom ? (
                        <button onClick={() => setActiveRoom(null)} className="hover:bg-gray-100 p-1 rounded-full -ml-1 text-gray-600">
                            <BackIcon />
                        </button>
                    ) : (
                        <div className="relative w-8 h-8 shrink-0">
                            <img src={userAvatar} alt="My Profile" className="w-full h-full rounded-full border border-gray-200 object-cover" />
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                        </div>
                    )}
                    
                    <span className="font-bold text-sm text-gray-800 truncate max-w-[180px]">
                        {activeRoom ? getOpponent(activeRoom)?.fullName : 'Pesan'}
                    </span>
                </div>
                
                {/* Tombol Minimize/Close */}
                <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="p-1 rounded-full hover:bg-gray-100">
                    <CloseIcon />
                </button>
            </div>

            {/* BODY CONTENT */}
            <div className="flex-1 bg-gray-50 overflow-y-auto custom-scrollbar relative">
                
                {/* LIST DAFTAR CHAT */}
                {!activeRoom && (
                    <div className="divide-y divide-gray-100 bg-white">
                        {rooms.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400 p-4 text-center">
                                <svg className="w-12 h-12 mb-2 opacity-20" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                                <p className="text-xs">Belum ada percakapan.</p>
                                <p className="text-[10px] mt-1">Mulai pesan jasa untuk chat dengan mitra.</p>
                            </div>
                        ) : (
                            rooms.map(room => {
                                const opponent = getOpponent(room);
                                const lastMsg = room.messages[room.messages.length - 1];
                                return (
                                    <div key={room._id} onClick={() => openRoom(room)} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-gray-100">
                                            <img src={opponent?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${opponent?.fullName}`} className="w-full h-full object-cover" alt="User" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <h4 className="text-xs font-bold text-gray-900 truncate">{opponent?.fullName}</h4>
                                                <span className="text-[9px] text-gray-400">{lastMsg ? new Date(lastMsg.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">{lastMsg ? lastMsg.content : <span className="italic text-gray-400">Mulai percakapan baru...</span>}</p>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                )}

                {/* ISI PERCAKAPAN */}
                {activeRoom && (
                    <div className="p-3 space-y-3 min-h-full flex flex-col justify-end pb-2">
                        {activeRoom.messages.length === 0 && (
                            <div className="text-center text-[10px] text-gray-400 py-4">
                                Mulai mengobrol dengan {getOpponent(activeRoom)?.fullName}
                            </div>
                        )}
                        {activeRoom.messages.map((msg, idx) => {
                            const senderId = typeof msg.sender === 'string' ? msg.sender : msg.sender._id;
                            const isMe = senderId === user.userId;
                            return (
                                <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs shadow-sm break-words ${isMe ? 'bg-red-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'}`}>
                                        {msg.content}
                                        <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-red-200' : 'text-gray-400'}`}>
                                            {new Date(msg.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* FOOTER INPUT (Hanya jika di dalam Room) */}
            {activeRoom && (
                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Tulis pesan..." 
                        className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-xs font-medium focus:ring-2 focus:ring-red-500 focus:bg-white transition-all outline-none placeholder-gray-400"
                        autoFocus
                    />
                    <button 
                        type="submit" 
                        disabled={!newMessage.trim()} 
                        className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 shadow-sm transition-transform active:scale-95 disabled:bg-gray-200 disabled:shadow-none"
                    >
                        <SendIcon />
                    </button>
                </form>
            )}
        </div>
    </div>
  );
}