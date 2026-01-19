"use client";

import { useCart } from "@/context/cart-context";
import { useToast } from "@/components/common/toast";

type Props = {
  id: number;
  name: string;
  price: string | number;
  image?: string | null;
};

export function AddToCartIconButton({ id, name, price, image }: Props) {
  const { cart, addToCart } = useCart();
  const { showToast } = useToast();

  const qty =
    cart.find((it) => it.id === id)?.qty ??
    cart.find((it) => it.name === name)?.qty ??
    0;

  return (
    <button
      type="button"
      aria-label={`Agregar ${name} al carrito`}
      title="Agregar al carrito"
      className="button-86"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();

        addToCart({ id, name, price, image });

        showToast({
          title: "Agregado al carrito",
          description: name,
        });
      }}
    >
      {qty > 0 ? qty : "+"}
    </button>
  );
}
 