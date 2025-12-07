// src/features/cart/useCart.ts
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

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
const DEBOUNCE_DELAY_MS = 300; // Tunggu 300ms sebelum tulis ke storage

export const getCartItemId = (serviceId: string, orderType: 'direct' | 'basic', providerId?: string | null) => {
    return `${serviceId}-${orderType}-${providerId || 'default'}`;
};

export const useCart = () => {
    // [HYDRATION FIX] State awal selalu kosong untuk menghindari mismatch Server vs Client
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    
    // Ref untuk melacak apakah perubahan state berasal dari event storage (tab lain)
    const isSyncingFromStorage = useRef(false);

    // 1. Initial Load & Storage Listener (Mount Only)
    useEffect(() => {
        // Load data awal dari LocalStorage
        try {
            const saved = localStorage.getItem(CART_KEY);
            if (saved) {
                setCart(JSON.parse(saved));
            }
        } catch (e) {
            console.error("[Cart] Failed to parse initial storage:", e);
        } finally {
            setIsInitialized(true);
        }

        // Listener untuk sinkronisasi antar Tab browser
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === CART_KEY) {
                try {
                    const newValue = event.newValue ? JSON.parse(event.newValue) : [];
                    isSyncingFromStorage.current = true; // Tandai flag
                    setCart(newValue);
                } catch (e) {
                    console.error("[Cart] Sync error:", e);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // 2. [OPTIMIZATION] Debounced Save ke localStorage
    useEffect(() => {
        // Jangan simpan jika belum inisialisasi atau update berasal dari tab lain
        if (!isInitialized) return;
        
        if (isSyncingFromStorage.current) {
            isSyncingFromStorage.current = false;
            return;
        }

        // Debounce: Tunda penulisan ke disk agar UI tidak blocking saat user spam klik
        const timeoutId = setTimeout(() => {
            try {
                localStorage.setItem(CART_KEY, JSON.stringify(cart));
            } catch (e) {
                console.error("[Cart] Save error:", e);
            }
        }, DEBOUNCE_DELAY_MS);

        return () => clearTimeout(timeoutId);
    }, [cart, isInitialized]);

    // [HELPER] Cek konflik lebih robust
    const checkConflict = useCallback((newItem: Omit<CartItem, 'totalPrice'|'id'>): boolean => {
        if (cart.length === 0) return false;

        // Cek apakah item baru bertentangan dengan item APAPUN yang sudah ada
        return cart.some(existingItem => {
            const isDifferentProvider = newItem.orderType === 'direct' && newItem.providerId !== existingItem.providerId;
            const isDifferentType = newItem.orderType !== existingItem.orderType;
            return isDifferentProvider || isDifferentType;
        });
    }, [cart]);

    // [ACTION] Update atau Tambah Item
    const upsertItem = useCallback((item: Omit<CartItem, 'totalPrice'|'id'>) => {
        const itemId = getCartItemId(item.serviceId, item.orderType, item.providerId);
        
        setCart(prevCart => {
            const existingIndex = prevCart.findIndex(existing => existing.id === itemId);
            const quantity = item.quantity;
            const totalPrice = quantity * item.pricePerUnit;

            // Hapus item jika quantity <= 0 (Validasi Defensive)
            if (quantity <= 0) {
                if (existingIndex >= 0) {
                    const updated = [...prevCart];
                    updated.splice(existingIndex, 1);
                    return updated;
                }
                return prevCart;
            }

            // Update item yang sudah ada
            if (existingIndex >= 0) {
                const updated = [...prevCart];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    ...item,
                    id: itemId,
                    totalPrice,
                };
                return updated;
            }

            // Tambah item baru
            const newItem: CartItem = {
                ...item,
                id: itemId,
                totalPrice,
            };

            return [...prevCart, newItem];
        });
    }, []);

    // [ACTION] Reset Cart dan Tambah Item Baru (Replace Cart)
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
            // Jika quantity 0, hapus item
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
        // Force clear localStorage segera untuk kasus logout/checkout success
        localStorage.removeItem(CART_KEY);
    }, []);

    // [OPTIMIZATION] Memoize Derived State
    const { totalItems, totalAmount } = useMemo(() => {
        return cart.reduce((acc, item) => ({
            totalItems: acc.totalItems + item.quantity,
            totalAmount: acc.totalAmount + item.totalPrice
        }), { totalItems: 0, totalAmount: 0 });
    }, [cart]);

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
        isInitialized // Expose state ini jika UI butuh loading state saat hydration
    };
};