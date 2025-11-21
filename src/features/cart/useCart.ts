// src/features/cart/useCart.ts
import { useState, useEffect, useCallback } from 'react';

// Tipe untuk satu item di Keranjang
export interface CartItem {
    id: string; // ID unik untuk item di keranjang (serviceId-orderType-[providerId])
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

export const getCartItemId = (serviceId: string, orderType: 'direct' | 'basic', providerId?: string | null) => {
    return `${serviceId}-${orderType}-${providerId || 'default'}`;
};

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

    const upsertItem = useCallback((item: Omit<CartItem, 'totalPrice'|'id'>) => {
        const itemId = getCartItemId(item.serviceId, item.orderType, item.providerId);

        setCart(prevCart => {
            const existingIndex = prevCart.findIndex(existing => {
                const existingKey = getCartItemId(existing.serviceId, existing.orderType, existing.providerId);
                return existing.id === itemId || existingKey === itemId;
            });

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
                const matches = item.id === itemId || getCartItemId(item.serviceId, item.orderType, item.providerId) === itemId;

                if (!matches) {
                    acc.push(item);
                    return acc;
                }

                if (quantity <= 0) return acc;

                acc.push({
                    ...item,
                    quantity,
                    totalPrice: quantity * item.pricePerUnit,
                });

                return acc;
            }, [] as CartItem[]);
        });
    }, []);

    const removeItem = useCallback((itemId: string) => {
        setCart(prevCart => prevCart.filter(item => item.id !== itemId && getCartItemId(item.serviceId, item.orderType, item.providerId) !== itemId));
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0); // Menghitung total kuantitas
    const totalAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0);

    return {
        cart,
        addItem: upsertItem,
        upsertItem,
        removeItem,
        clearCart,
        totalItems,
        totalAmount,
        updateItemQuantity,
        isHydrated
    };
};