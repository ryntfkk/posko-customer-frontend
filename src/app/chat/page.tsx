// src/app/(customer)/chat/page.tsx
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/axios';
import { fetchProfile } from '@/features/auth/api';
import { listOrders } from '@/features/orders/api';
import { User } from '@/features/auth/types';
import { Order, PopulatedProvider } from '@/features/orders/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

// --- ICONS ---
const BackIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>;
const SendIcon = () => <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const ImageIcon = () => <svg className="w-6 h-6 text-gray-500 hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const XIcon = () => <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;

// --- TYPES ---
interface ChatUser { _id: string; fullName: string; profilePictureUrl: string; }
interface Attachment { url: string; type: 'image' | 'video' | 'document'; originalName?: string; }
interface Message { 
  _id: string; 
  content: string; 
  attachment?: Attachment; 
  sender: string | { _id: string, fullName: string }; 
  sentAt: string; 
}
interface ChatRoom { _id: string; participants: ChatUser[]; messages: Message[]; updatedAt: string; }

export default function ChatPage() {
  const router = useRouter();
  
  // Data State
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Chat State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ file: File, url: string } | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const myId = user ? user._id : null;

  // Helper: Get Sender ID safely
  const getSenderId = (sender: string | { _id: string }) => {
    return typeof sender === 'object' ? sender._id : sender;
  };

  // 1. Initialize Chat & Socket
  useEffect(() => {
    const initChat = async () => {
      const token = localStorage.getItem('posko_token');
      if (!token) { router.push('/login'); return; }

      try {
        const profileRes = await fetchProfile();
        const currentUser = profileRes.data.profile;
        setUser(currentUser);

        const chatRes = await api.get('/chat');
        setRooms(chatRes.data.data);

        // Fetch orders untuk snippet info
        const ordersRes = await listOrders('customer');
        const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
        const activeOnly = orders.filter(o => 
            ['pending', 'paid', 'accepted', 'on_the_way', 'working', 'waiting_approval'].includes(o.status)
        );
        setActiveOrders(activeOnly);

        // Socket Connection
        const newSocket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
        
        newSocket.on('receive_message', (data: { roomId: string, message: Message }) => {
          // Update List Room (Move to top)
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

          // Update Active Room if open
          setActiveRoom(current => {
            if (current && current._id === data.roomId) {
              return { ...current, messages: [...current.messages, data.message] };
            }
            return current;
          });
        });

        setSocket(newSocket);

      } catch (error) { 
        console.error("Init Error:", error); 
      } finally { 
        setIsLoading(false); 
      }
    };

    initChat();
    return () => { socket?.disconnect(); };
  }, [router]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeRoom?.messages, previewImage]);

  // Helper: Get Opponent User
  const getOpponent = useCallback((room: ChatRoom | null) => {
    if (!room || !myId) return null;
    return room.participants.find(p => p._id !== myId) || room.participants[0];
  }, [myId]);

  // Helper: Find Related Order
  const relatedOrder = useMemo(() => {
    if (!activeRoom || !user || activeOrders.length === 0) return null;
    const opponent = getOpponent(activeRoom);
    if (!opponent) return null;

    return activeOrders.find(order => {
        const pId = order.providerId;
        let provUserId = '';
        if (pId && typeof pId === 'object' && 'userId' in pId) {
            const u = (pId as PopulatedProvider).userId;
            provUserId = u._id;
        }
        return provUserId === opponent._id;
    });
  }, [activeRoom, activeOrders, user, getOpponent]);

  // --- HANDLERS ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Limit 5MB
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran file maksimal 5MB");
        return;
      }
      // Set Preview
      setPreviewImage({
        file,
        url: URL.createObjectURL(file)
      });
    }
  };

  const cancelPreview = () => {
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !previewImage) || !activeRoom || !socket) return;

    let attachmentData = null;

    // 1. Upload Image if exists
    if (previewImage) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', previewImage.file);

        const res = await api.post('/chat/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        attachmentData = res.data.data; // { url, type }
      } catch (error) {
        console.error("Upload failed", error);
        alert("Gagal mengupload gambar.");
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    // 2. Emit Socket Message
    socket.emit('send_message', { 
      roomId: activeRoom._id, 
      content: newMessage,
      attachment: attachmentData 
    });

    // 3. Reset State
    setNewMessage('');
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openRoom = async (room: ChatRoom) => {
    try {
        const res = await api.get(`/chat/${room._id}`);
        setActiveRoom(res.data.data);
        socket?.emit('join_chat', room._id);
        
        // Reset input states
        setNewMessage('');
        setPreviewImage(null);
    } catch (error) { console.error(error); }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-white text-sm text-gray-500">Memuat percakapan...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col md:flex-row max-w-7xl mx-auto md:my-8 md:rounded-2xl border-gray-200 md:border md:h-[800px] md:overflow-hidden relative">
      
      {/* --- LIST ROOMS (SIDEBAR) --- */}
      <div className={`w-full md:w-1/3 bg-white flex flex-col ${activeRoom ? 'hidden md:flex' : 'flex h-screen md:h-auto'}`}>
        {/* Header List */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="md:hidden text-gray-600 p-1"><BackIcon /></button>
                <h1 className="text-xl font-bold text-gray-900">Pesan</h1>
            </div>
            <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                {user && <Image src={user.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.fullName}`} alt="Me" width={36} height={36} className="object-cover" />}
            </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 md:pb-0">
            {rooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-sm">
                    <p>Belum ada pesan masuk.</p>
                </div>
            ) : (
                rooms.map(room => {
                    const opponent = getOpponent(room);
                    const lastMsg = room.messages[room.messages.length - 1];
                    const isActive = activeRoom?._id === room._id;
                    const isLastMsgImage = lastMsg?.attachment?.type === 'image';

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
                                    <span className="text-[10px] text-gray-400">{lastMsg ? new Date(lastMsg.sentAt).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit', hour12: false}) : ''}</span>
                                </div>
                                <p className={`text-xs truncate ${isActive ? 'text-red-600/70' : 'text-gray-500'}`}>
                                    {lastMsg ? (
                                        getSenderId(lastMsg.sender) === myId ? (
                                            <span className="flex items-center gap-1">Anda: {isLastMsgImage ? '📷 Foto' : lastMsg.content}</span>
                                        ) : (
                                            <span className="flex items-center gap-1">{isLastMsgImage ? '📷 Foto' : lastMsg.content}</span>
                                        )
                                    ) : <span className="italic opacity-60">Mulai obrolan baru...</span>}
                                </p>
                            </div>
                        </button>
                    );
                })
            )}
        </div>
      </div>

      {/* --- DETAIL CHAT (MAIN AREA) --- */}
      <div className={`w-full md:w-2/3 bg-[#f0f2f5] md:bg-gray-50 flex-col ${activeRoom ? 'flex h-screen md:h-auto' : 'hidden md:flex'} relative`}>
        {activeRoom ? (
            <>
                {/* 1. Header Chat */}
                <div className="bg-white px-4 py-3 border-b border-gray-200 flex flex-col sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setActiveRoom(null)} className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><BackIcon /></button>
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-200 shrink-0">
                            <Image src={getOpponent(activeRoom)?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${getOpponent(activeRoom)?.fullName}`} alt="User" width={40} height={40} className="object-cover" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-sm text-gray-900 truncate">{getOpponent(activeRoom)?.fullName}</span>
                            <span className="text-[10px] text-green-600 font-medium flex items-center gap-1">● Online</span>
                        </div>
                    </div>

                    {/* Order Snippet (Context) */}
                    {relatedOrder && (
                        <div 
                            onClick={() => router.push(`/orders/${relatedOrder._id}`)}
                            className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-blue-100 transition-colors"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 border border-blue-100 font-bold text-xs shrink-0">
                                    {relatedOrder.orderNumber?.slice(-4) || 'ORD'}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-blue-800 font-bold truncate">{relatedOrder.items[0]?.name}</p>
                                    <p className="text-[10px] text-blue-600 truncate">Status: {relatedOrder.status.replace(/_/g, ' ').toUpperCase()}</p>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-xs font-black text-blue-900">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(relatedOrder.totalAmount)}</p>
                                <span className="text-[10px] text-blue-500 underline">Detail →</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Message Area */}
                {/* PB-32 untuk memberi ruang input bar di mobile */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-[140px] md:pb-4 custom-scrollbar">
                    {activeRoom.messages.map((msg, idx) => {
                        const senderId = getSenderId(msg.sender);
                        const isMe = senderId === myId;

                        return (
                            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex flex-col max-w-[80%] md:max-w-[60%] ${isMe ? 'items-end' : 'items-start'}`}>
                                    
                                    {/* Image Bubble */}
                                    {msg.attachment?.type === 'image' && (
                                        <div className={`mb-1 overflow-hidden rounded-2xl border ${isMe ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
                                            <Image 
                                                src={`${process.env.NEXT_PUBLIC_API_URL}${msg.attachment.url}`} 
                                                alt="Attachment" 
                                                width={200} height={200} 
                                                className="w-full h-auto object-cover max-h-60"
                                            />
                                        </div>
                                    )}

                                    {/* Text Bubble */}
                                    {msg.content && (
                                        <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm break-words ${
                                            isMe ? 'bg-red-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                                        }`}>
                                            {msg.content}
                                        </div>
                                    )}

                                    {/* Timestamp */}
                                    <p className="text-[9px] mt-1 text-gray-400 px-1">
                                        {new Date(msg.sentAt).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit', hour12: false})}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* 3. Input Area (Fixed/Sticky) */}
                {/* Logic: Di Mobile fixed bottom-[88px] agar di atas BottomNav. Di Desktop sticky bottom-0 */}
                <div className="fixed bottom-[88px] left-0 right-0 md:static md:bottom-auto bg-white border-t border-gray-200 p-3 z-40">
                    
                    {/* Preview Image sebelum dikirim */}
                    {previewImage && (
                        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-100">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                                <Image src={previewImage.url} alt="Preview" fill className="object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-700 truncate">{previewImage.file.name}</p>
                                <p className="text-[10px] text-gray-500">{(previewImage.file.size / 1024).toFixed(0)} KB</p>
                            </div>
                            <button onClick={cancelPreview} className="p-1 bg-gray-400 rounded-full hover:bg-gray-600 transition-colors">
                                <XIcon />
                            </button>
                        </div>
                    )}

                    {/* Form Input */}
                    <form onSubmit={handleSendMessage} className="flex items-end gap-2 max-w-4xl mx-auto">
                        {/* Tombol Upload */}
                        <div className="pb-1.5">
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                            />
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200 hover:text-red-600 transition-all"
                                title="Kirim Gambar"
                            >
                                <ImageIcon />
                            </button>
                        </div>

                        {/* Text Field */}
                        <div className="flex-1 bg-gray-100 rounded-2xl flex items-center px-4 py-2 focus-within:ring-2 focus-within:ring-red-500 focus-within:bg-white transition-all">
                            <input 
                                type="text" 
                                value={newMessage} 
                                onChange={(e) => setNewMessage(e.target.value)} 
                                placeholder={previewImage ? "Tambah keterangan..." : "Ketik pesan..."}
                                className="flex-1 bg-transparent border-none text-gray-900 text-sm focus:ring-0 outline-none max-h-24 py-1"
                                disabled={isUploading}
                            />
                        </div>

                        {/* Send Button */}
                        <div className="pb-1">
                            <button 
                                type="submit" 
                                disabled={(!newMessage.trim() && !previewImage) || isUploading} 
                                className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 shadow-md transition-all disabled:bg-gray-300 disabled:shadow-none"
                            >
                                {isUploading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <SendIcon />
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </>
        ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-300 bg-gray-50">
                <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                <p>Pilih percakapan untuk memulai</p>
            </div>
        )}
      </div>
    </div>
  );
}