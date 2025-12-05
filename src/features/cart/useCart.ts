// src/features/cart/useCart.ts
import { useState, useEffect, useCallback } from 'react';

// Tipe untuk satu item di Keranjang
export interface CartItem {
    id: string;
    serviceId: string;
    serviceName: string;
    category?: string;
    orderType: 'direct' | 'basic';
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
    providerId?: string;
    providerName?: string;
}

const CART_KEY = 'posko_cart';

export const getCartItemId = (serviceId: string, orderType: 'direct' | 'basic', providerId?: string | null) => {
    return `${serviceId}-${orderType}-${providerId || 'default'}`;
};

export const useCart = () => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    // 1. Inisialisasi & Listener Storage (Sinkronisasi Antar Tab)
    useEffect(() => {
        // Load awal
        const loadCart = () => {
            const savedCart = localStorage.getItem(CART_KEY);
            if (savedCart) {
                try {
                    setCart(JSON.parse(savedCart));
                } catch (e) {
                    console.error("Failed to parse cart from localStorage", e);
                    setCart([]);
                }
            }
        };

        loadCart();
        setIsHydrated(true);

        // Handler saat LocalStorage berubah di Tab lain
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === CART_KEY && event.newValue) {
                try {
                    setCart(JSON.parse(event.newValue));
                } catch (e) {
                    console.error("Failed to sync cart from storage event", e);
                }
            } else if (event.key === CART_KEY && !event.newValue) {
                // Jika key dihapus (clear cart di tab lain)
                setCart([]);
            }
        };

        // Handler saat window fokus kembali (untuk memastikan data fresh)
        const handleFocus = () => {
            loadCart();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    // 2. Simpan ke localStorage setiap kali state cart berubah (Hanya di tab aktif)
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
        }
    }, [cart, isHydrated]);

    // [HELPER] Cek apakah item baru konflik dengan item lama (Provider beda / Tipe beda)
    const checkConflict = useCallback((item: Omit<CartItem, 'totalPrice'|'id'>): boolean => {
        if (cart.length === 0) return false;

        const existingItem = cart[0];
        
        const isDifferentProvider = item.orderType === 'direct' && item.providerId !== existingItem.providerId;
        const isDifferentType = item.orderType !== existingItem.orderType;
        // Cek kategori hanya jika basic order (opsional, tergantung rule bisnis)
        const isDifferentCategory = item.orderType === 'basic'
            && existingItem.orderType === 'basic'
            && (existingItem.category ?? null) !== (item.category ?? null);

        return isDifferentProvider || isDifferentType || isDifferentCategory;
    }, [cart]);

    // [MODIFIED] Update atau Tambah Item
    const upsertItem = useCallback((item: Omit<CartItem, 'totalPrice'|'id'>) => {
        const itemId = getCartItemId(item.serviceId, item.orderType, item.providerId);

        setCart(prevCart => {
            const existingIndex = prevCart.findIndex(existing => existing.id === itemId);
            const totalPrice = item.quantity * item.pricePerUnit;

            if (existingIndex >= 0) {
                const updated = [...prevCart];
                // Hapus jika quantity 0
                if (item.quantity <= 0) {
                    updated.splice(existingIndex, 1);
                    return updated;
                }

                updated[existingIndex] = {
                    ...updated[existingIndex],
                    ...item,
                    id: itemId,
                    totalPrice,
                };
                return updated;
            }

            if (item.quantity <= 0) return prevCart;

            const newItem: CartItem = {
                ...item,
                id: itemId,
                totalPrice,
            };

            return [...prevCart, newItem];
        });
    }, []);

    // [HELPER] Reset Cart dan Tambah Item Baru (Untuk User yang setuju ganti provider)
    const resetAndAddItem = useCallback((item: Omit<CartItem, 'totalPrice'|'id'>) => {
        const itemId = getCartItemId(item.serviceId, item.orderType, item.providerId);
        const totalPrice = item.quantity * item.pricePerUnit;

        const newItem: CartItem = {
             ...item,
             id: itemId,
             totalPrice,
        };
        
        setCart([newItem]);
    }, []);

    const updateItemQuantity = useCallback((itemId: string, quantity: number) => {
        setCart(prevCart => {
            return prevCart.reduce((acc, item) => {
                if (item.id === itemId) {
                    if (quantity > 0) {
                        acc.push({
                            ...item,
                            quantity,
                            totalPrice: quantity * item.pricePerUnit,
                        });
                    }
                } else {
                    acc.push(item);
                }
                return acc;
            }, [] as CartItem[]);
        });
    }, []);

    const removeItem = useCallback((itemId: string) => {
        setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0);

    return {
        cart,
        upsertItem, 
        resetAndAddItem,
        checkConflict,
        removeItem,
        clearCart,
        totalItems,
        totalAmount,
        updateItemQuantity,
        isHydrated
    };
};