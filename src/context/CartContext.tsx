import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type BillingCycle = 'monthly' | 'yearly';

export type CartItem = {
  id: number;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly?: number;
  cycle: BillingCycle;
  image?: string;
};

export type PromoState = {
  code: string;
  discount: number;
  discountedTotal: number;
  type: string;
};

type CartState = {
  items: CartItem[];
  total: number;
  count: number;
  promo: PromoState | null;
  setPromo: (promo: PromoState | null) => void;
  has: (id: number) => boolean;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number) => void;
  changeCycle: (id: number, cycle: BillingCycle) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartState | null>(null);
const STORAGE_KEY = '@cynasecure/cart';

function priceOf(item: CartItem) {
  if (item.cycle === 'yearly') {
    return item.priceYearly ?? Math.round(item.priceMonthly * 12 * 0.85);
  }
  return item.priceMonthly;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promo, setPromo] = useState<PromoState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setItems(JSON.parse(raw));
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const addToCart = (item: CartItem) => {
    if (!items.some((p) => p.id === item.id)) {
      setPromo(null);
    }
    setItems((prev) => {
      if (prev.some((p) => p.id === item.id)) return prev;
      return [...prev, item];
    });
  };

  const removeFromCart = (id: number) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
    setPromo(null);
  };

  const changeCycle = (id: number, cycle: BillingCycle) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, cycle } : p)));
  };

  const clearCart = () => {
    setItems([]);
    setPromo(null);
  };

  const total = useMemo(() => items.reduce((sum, it) => sum + priceOf(it), 0), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        count: items.length,
        promo,
        setPromo,
        has: (id) => items.some((p) => p.id === id),
        addToCart,
        removeFromCart,
        changeCycle,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart doit être utilisé dans <CartProvider>');
  return ctx;
}
