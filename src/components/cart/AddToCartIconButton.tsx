"use client";

import { ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useCart } from "@/context/cart-context";

type Props = ProductCardProps;

export function AddToCartIconButton({ id, name, price, imageUrl }: Props) {
  const { showToast } = useToast();
  const { addToCart } = useCart();

  return (
    <button
      type="button"
      aria-label={`Agregar ${name} al carrito`}
      title="Agregar al carrito"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/90 backdrop-blur-sm text-black shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all hover:scale-105 hover:bg-white hover:shadow-[0_6px_16px_rgba(0,0,0,0.2)]"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();

        addToCart({ id, name, price, imageUrl });
        showToast({
          title: "Agregado al carrito",
          description: name,
        });
      }}
    >
      <ShoppingBag size={16} aria-hidden="true" />
    </button>
  );
}
 
