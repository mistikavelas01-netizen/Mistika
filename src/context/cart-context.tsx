"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "mistika-cart";

const CartContext = createContext<CartContextValue | null>(null);

function parsePrice(labelOrNumber: unknown): number {
  if (typeof labelOrNumber === "number") return labelOrNumber;
  if (!labelOrNumber) return 0;

  const sanitized = String(labelOrNumber)
    .replace(/[^\d.,]/g, "")
    .replace(/\.(?=\d{3}\b)/g, "");

  return Number.parseFloat(sanitized.replace(",", ".")) || 0;
}

function normalizeItem(item: CartItem): CartItem {
  const quantity = Math.max(1, Number(item.quantity || 1));
  const priceNumber = Number.isFinite(item.priceNumber)
    ? item.priceNumber
    : parsePrice(item.price);

  return {
    ...item,
    quantity,
    priceNumber,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (Array.isArray(saved)) {
        setCart(saved.map(normalizeItem));
      }
    } catch {
      setCart([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart: CartContextValue["addToCart"] = (item) =>
    setCart((prev) => {
      const idx = prev.findIndex((p) =>
        item.id != null ? p.id === item.id : p.name === item.name,
      );

      if (idx !== -1) {
        const copy = [...prev];
        const existing = normalizeItem(copy[idx]);
        copy[idx] = {
          ...existing,
          quantity: existing.quantity + 1,
          priceNumber: parsePrice(existing.priceNumber ?? item.price),
        };
        return copy;
      }

      return [
        ...prev,
        normalizeItem({
          ...item,
          quantity: 1,
          priceNumber: parsePrice(item.price),
        } as CartItem),
      ];
    });

  const removeFromCart: CartContextValue["removeFromCart"] = (name) =>
    setCart((prev) => prev.filter((p) => p.name !== name));

  const updateQuantity: CartContextValue["updateQuantity"] = (name, quantity) =>
    setCart((prev) =>
      prev.map((p) =>
        p.name === name
          ? {
              ...p,
              quantity: Math.max(1, Number(quantity) || 1),
              priceNumber: parsePrice(p.priceNumber ?? p.price),
            }
          : p,
      ),
    );

  const clearCart: CartContextValue["clearCart"] = () => setCart([]);

  const totalQuantity = useMemo(
    () => cart.reduce((total, it) => total + (it.quantity || 1), 0),
    [cart],
  );

  const totalPrice = useMemo(
    () =>
      cart.reduce(
        (total, it) =>
          total +
          (Number.isFinite(it.priceNumber)
            ? it.priceNumber
            : parsePrice(it.price)) *
            (it.quantity || 1),
        0,
      ),
    [cart],
  );

  const value: CartContextValue = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalQuantity,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
