"use client";

import Image from "next/image";
import Link from "next/link";
import { AddToCartIconButton } from "@/components/cart/AddToCartIconButton";

type Props = {
  product: Product;
};

export default function ProductCard({ product }: Props) {
  const displayPrice = product.isOnSale && product.discountPrice
    ? product.discountPrice
    : product.price;
  const priceLabel = displayPrice?.toString() ?? "—";
  const originalPrice = product.isOnSale && product.discountPrice && product.price
    ? product.price
    : null;
  const imageUrl = product.imageUrl || "";

  return (
    <Link
      href={`/${product.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-[0_12px_28px_rgba(0,0,0,0.08)] transition-transform duration-500 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-black/5">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="(min-width: 1280px) 22vw, (min-width: 768px) 45vw, 90vw"
          className="scale-105 object-cover"
        />

        {/* Add to cart button - stops propagation to prevent navigation */}
        <div
          className="absolute right-3 top-3 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <AddToCartIconButton
            id={product.id}
            name={product.name}
            price={displayPrice?.toString() ?? "0"}
            imageUrl={product.imageUrl ?? null}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between gap-2 p-4">
        <h3 className="text-lg font-semibold leading-snug line-clamp-2">
          {product.name}
        </h3>
        
        <div className="flex items-center gap-2">
          {product.isOnSale && originalPrice ? (
            <>
              <span className="text-sm font-semibold text-red-600">
                ${priceLabel} MXN
              </span>
              <span className="text-xs text-black/50 line-through">
                ${originalPrice} MXN
              </span>
              <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-red-700">
                Oferta
              </span>
            </>
          ) : (
            <span className="text-sm text-black/60">${priceLabel} MXN</span>
          )}
        </div>
      </div>
    </Link>
  );
}
