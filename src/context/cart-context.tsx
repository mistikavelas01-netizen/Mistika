"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "mistika-cart";

export type CartItem = {
  id?: number | string;
  name: string;
  image?: string | null;
  price: number | string;
  priceNumber: number;
  qty: number;
};

type CartContextValue = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "qty" | "priceNumber">) => void;
  removeFromCart: (name: string) => void;
  updateQty: (name: string, qty: number) => void;
  clearCart: () => void;
  totalQty: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextValue | null>(null);

function parsePrice(labelOrNumber: unknown): number {
  if (typeof labelOrNumber === "number") return labelOrNumber;
  if (!labelOrNumber) return 0;

  const s = String(labelOrNumber)
    .replace(/[^\d.,]/g, "")
    .replace(/\.(?=\d{3}\b)/g, "");

  return Number.parseFloat(s.replace(",", ".")) || 0;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) setCart(saved);
    } catch {
      setCart([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart: CartContextValue["addToCart"] = (item) =>
    setCart((prev) => {
      const idx = prev.findIndex((p) =>
        item.id != null ? p.id === item.id : p.name === item.name,
      );
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          qty: (copy[idx].qty || 1) + 1,
          priceNumber: parsePrice(copy[idx].priceNumber ?? item.price),
        };
        return copy;
      }

      return [
        ...prev,
        {
          ...item,
          qty: 1,
          priceNumber: parsePrice(item.price),
        },
      ];
    });

  const removeFromCart = (name: string) =>
    setCart((prev) => prev.filter((p) => p.name !== name));

  const updateQty = (name: string, qty: number) =>
    setCart((prev) =>
      prev.map((p) =>
        p.name === name ? { ...p, qty: Math.max(1, Number(qty)) } : p,
      ),
    );

  const clearCart = () => setCart([]);

  const totalQty = useMemo(
    () => cart.reduce((t, it) => t + (it.qty || 1), 0),
    [cart],
  );

  const totalPrice = useMemo(
    () =>
      cart.reduce((sum, it) => sum + (it.priceNumber || 0) * (it.qty || 1), 0),
    [cart],
  );

  const value: CartContextValue = {
    cart,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    totalQty,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
