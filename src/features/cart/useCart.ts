// src/features/cart/useCart.ts
import { useState, useEffect, useCallback, useMemo } from 'react';

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

// Helper function to load cart from localStorage
const loadCartFromStorage = (): CartItem[] => {
    try {
        const savedCart = localStorage.getItem(CART_KEY);
        if (savedCart) {
            return JSON.parse(savedCart);
        }
    } catch (e) {
        console.error("Failed to parse cart from localStorage", e);
    }
    return [];
};

export const useCart = () => {
    // Initialize state with a lazy initializer to avoid reading localStorage on every render
    const [cart, setCart] = useState<CartItem[]>(() => loadCartFromStorage());
    const [isHydrated, setIsHydrated] = useState(false);

    // Mark as hydrated on mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // Simpan ke localStorage setiap kali state cart berubah
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
        }
    }, [cart, isHydrated]);

    const upsertItem = useCallback((item: Omit<CartItem, 'totalPrice'|'id'>) => {
        const itemId = getCartItemId(item.serviceId, item.orderType, item.providerId);

        setCart(prevCart => {
            // 1. CEK KONFLIK PROVIDER (Logic Baru)
            // Jika keranjang ada isinya, cek apakah item baru berasal dari provider/tipe yang berbeda?
            if (prevCart.length > 0) {
                const existingItem = prevCart[0]; // Ambil sampel item pertama
                
                const isDifferentProvider = item.orderType === 'direct' && item.providerId !== existingItem.providerId;
                const isDifferentType = item.orderType !== existingItem.orderType;
                const isDifferentCategory = item.orderType === 'basic'
                    && existingItem.orderType === 'basic'
                    && (existingItem.category ?? null) !== (item.category ?? null);

                // Jika Beda Provider atau Beda Tipe Order -> RESET KERANJANG (Ganti dengan item baru ini saja)
                if (isDifferentProvider || isDifferentType || isDifferentCategory) {
                    return [{
                        ...item,
                        id: itemId,
                        totalPrice: item.quantity * item.pricePerUnit,
                    }];
                }
            }

            // 2. LOGIC UPDATE BIASA (Jika provider sama atau cart kosong)
            const existingIndex = prevCart.findIndex(existing => existing.id === itemId);
            const totalPrice = item.quantity * item.pricePerUnit;

            if (existingIndex >= 0) {
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

            if (item.quantity <= 0) return prevCart;

            const newItem: CartItem = {
                ...item,
                id: itemId,
                totalPrice,
            };

            return [...prevCart, newItem];
        });
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

    // Memoize computed values to avoid recalculating on every render
    const totalItems = useMemo(() => 
        cart.reduce((sum, item) => sum + item.quantity, 0),
        [cart]
    );
    
    const totalAmount = useMemo(() => 
        cart.reduce((sum, item) => sum + item.totalPrice, 0),
        [cart]
    );

    return {
        cart,
        upsertItem,
        removeItem,
        clearCart,
        totalItems,
        totalAmount,
        updateItemQuantity,
        isHydrated
    };
};