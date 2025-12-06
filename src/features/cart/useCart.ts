// src/features/cart/useCart.ts
import { useState, useEffect, useCallback, useRef } from 'react';

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
    // 1. Lazy Initialization (Baca storage hanya SEKALI saat mount)
    const [cart, setCart] = useState<CartItem[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const saved = localStorage.getItem(CART_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("[Cart] Failed to parse initial storage:", e);
            return [];
        }
    });

    const [isHydrated, setIsHydrated] = useState(false);
    
    // Ref untuk melacak apakah perubahan state berasal dari event storage (tab lain)
    // agar kita tidak menulis balik ke storage secara redundan.
    const isSyncingFromStorage = useRef(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // 2. Listener Storage (Sinkronisasi Antar Tab)
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === CART_KEY) {
                try {
                    const newValue = event.newValue ? JSON.parse(event.newValue) : [];
                    // Set flag sync agar useEffect penulis tidak menimpa balik
                    isSyncingFromStorage.current = true;
                    setCart(newValue);
                } catch (e) {
                    console.error("[Cart] Sync error:", e);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // 3. Simpan ke localStorage setiap kali state cart berubah
    // (Hanya jika perubahan BUKAN berasal dari sinkronisasi tab lain)
    useEffect(() => {
        if (isHydrated) {
            if (isSyncingFromStorage.current) {
                // Reset flag dan jangan tulis ke storage (karena data sudah dari storage)
                isSyncingFromStorage.current = false;
                return;
            }
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
        }
    }, [cart, isHydrated]);

    // [HELPER] Cek konflik lebih robust (Iterasi seluruh cart, bukan cuma index 0)
    const checkConflict = useCallback((newItem: Omit<CartItem, 'totalPrice'|'id'>): boolean => {
        if (cart.length === 0) return false;

        // Ambil sampel order yang ada (biasanya keranjang harus homogen)
        // Kita cek apakah item baru bertentangan dengan item APAPUN yang sudah ada
        const hasConflict = cart.some(existingItem => {
            const isDifferentProvider = newItem.orderType === 'direct' && newItem.providerId !== existingItem.providerId;
            const isDifferentType = newItem.orderType !== existingItem.orderType;
            
            // Aturan Bisnis: Order Basic sebaiknya satu kategori dalam satu checkout (Opsional, tergantung rule)
            // Jika rule membolehkan mix category di basic, hapus bagian ini.
            // Di sini kita asumsikan Strict Mode: Satu checkout = Satu tipe flow.
            
            return isDifferentProvider || isDifferentType;
        });

        return hasConflict;
    }, [cart]);

    // [MODIFIED] Update atau Tambah Item
    const upsertItem = useCallback((item: Omit<CartItem, 'totalPrice'|'id'>) => {
        const itemId = getCartItemId(item.serviceId, item.orderType, item.providerId);
        const totalPrice = item.quantity * item.pricePerUnit;

        setCart(prevCart => {
            const existingIndex = prevCart.findIndex(existing => existing.id === itemId);

            if (existingIndex >= 0) {
                // Item sudah ada, update
                const updated = [...prevCart];
                
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

            // Item baru
            if (item.quantity <= 0) return prevCart;

            const newItem: CartItem = {
                ...item,
                id: itemId,
                totalPrice,
            };

            return [...prevCart, newItem];
        });
    }, []);

    // [HELPER] Reset Cart dan Tambah Item Baru (Replace Cart)
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
            // Jika quantity 0, filter out (hapus)
            if (quantity <= 0) {
                return prevCart.filter(item => item.id !== itemId);
            }

            return prevCart.map(item => {
                if (item.id === itemId) {
                    return {
                        ...item,
                        quantity,
                        totalPrice: quantity * item.pricePerUnit,
                    };
                }
                return item;
            });
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