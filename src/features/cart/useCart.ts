// src/features/cart/useCart.ts
import { useState, useEffect, useCallback } from 'react';

// Tipe untuk satu item di Keranjang
export interface CartItem {
    id: string; // ID unik untuk item di keranjang (misal: serviceId-orderType)
    serviceId: string;
    serviceName: string;
    orderType: 'direct' | 'basic';
    quantity: number;
    pricePerUnit: number; // Harga yang disepakati (BasePrice saat ini)
    totalPrice: number;
    providerId?: string; 
    providerName?: string;
}

const CART_KEY = 'posko_cart';

export const useCart = () => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    // Ambil dari localStorage saat inisialisasi
    useEffect(() => {
        const savedCart = localStorage.getItem(CART_KEY);
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error("Failed to parse cart from localStorage", e);
                setCart([]);
            }
        }
        setIsHydrated(true);
    }, []);

    // Simpan ke localStorage setiap kali state cart berubah
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
        }
    }, [cart, isHydrated]);

    const addItem = useCallback((item: Omit<CartItem, 'totalPrice'|'id'>) => {
        const itemId = `${item.serviceId}-${item.orderType}-${Date.now()}`; // Pastikan ID unik
        const newItem: CartItem = {
            ...item,
            id: itemId,
            totalPrice: item.quantity * item.pricePerUnit
        };
        
        setCart(prevCart => {
            return [...prevCart, newItem];
        });
    }, []);

    const removeItem = useCallback((itemId: string) => {
        setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0); // Menghitung total kuantitas
    const totalAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0);

    return {
        cart,
        addItem,
        removeItem,
        clearCart,
        totalItems,
        totalAmount,
        isHydrated
    };
};