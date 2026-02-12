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

function parsePrice(labelOrNumber: string | number | null | undefined): number {
  if (typeof labelOrNumber === "number") return labelOrNumber;
  if (!labelOrNumber) return 0;

  const sanitized = String(labelOrNumber)
    .replace(/[^\d.,]/g, "")
    .replace(/\.(?=\d{3}\b)/g, "");

  return Number.parseFloat(sanitized.replace(",", ".")) || 0;
}

function normalizeStock(value: string | number | null | undefined): number | undefined {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(0, Math.floor(parsed));
}

function clampQuantity(quantity: number, stock?: number): number {
  const normalized = Math.max(1, Number(quantity) || 1);
  if (typeof stock === "number" && Number.isFinite(stock)) {
    const maxStock = Math.max(0, Math.floor(stock));
    if (maxStock > 0) {
      return Math.min(normalized, maxStock);
    }
  }
  return normalized;
}

function normalizeItem(item: CartItem): CartItem {
  const stock = normalizeStock(item.stock);
  const quantity = clampQuantity(item.quantity, stock);
  const priceNumber = Number.isFinite(item.priceNumber)
    ? item.priceNumber
    : parsePrice(item.price);

  return {
    ...item,
    quantity,
    priceNumber,
    stock,
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
        const stock = normalizeStock(item.stock ?? existing.stock);
        if (stock !== undefined && stock <= 0) {
          return prev;
        }
        const nextQuantity = clampQuantity(existing.quantity + 1, stock);
        if (nextQuantity === existing.quantity) {
          return prev;
        }
        copy[idx] = {
          ...existing,
          quantity: nextQuantity,
          priceNumber: parsePrice(existing.priceNumber ?? item.price),
          stock: stock ?? existing.stock,
        };
        return copy;
      }

      const stock = normalizeStock(item.stock);
      if (stock !== undefined && stock <= 0) {
        return prev;
      }
      const quantity = clampQuantity(1, stock);
      return [
        ...prev,
        normalizeItem({
          ...item,
          quantity,
          priceNumber: parsePrice(item.price),
          stock,
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
              quantity: clampQuantity(quantity, normalizeStock(p.stock)),
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
