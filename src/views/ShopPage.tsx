"use client";

import Link from "next/link";
import { AddToCartIconButton } from "@/components/cart/AddToCartIconButton";
import ProductCarousel from "@/components/shop/ProductCarousel";
import { useFetchProductsQuery } from "@/store/features/products/productsApi";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/store/features/api/getApiErrorMessage";

export function ShopPage() {
  const { data: productsData, isLoading: isLoadingProducts, isError: isErrorProducts, error: errorProducts } = useFetchProductsQuery(undefined, { skip: false });
  const products: Product[] = productsData?.data || [];

  const errorMessage = getApiErrorMessage(errorProducts);

  useEffect(() => {
    if (isErrorProducts && errorMessage) {
      toast.error(errorMessage);
    }
  }, [isErrorProducts, errorMessage]);

  if (isLoadingProducts) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-neutral-600">Cargando productos...</p>
      </main>
    );
  }

  if (isErrorProducts) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-neutral-600">
          {errorMessage ?? "No se pudieron cargar los productos."}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-10">
      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
        <ProductCarousel />
      </div>

      <div className="relative mb-10 pt-10">
        <div className="absolute right-0 top-4">
          <Link
            href="/cart"
            className="rounded-full bg-black px-7 py-3 text-base font-medium text-white hover:opacity-90"
          >
            Ver carrito
          </Link>
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-semibold tracking-[0.25em]">MISTIKA</h1>

          <h3 className="mx-auto mt-3 max-w-xl text-sm text-neutral-900">
            Aromas que abrazan tu espacio: velas y rituales que convierten lo
            cotidiano en magia.
          </h3>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.length === 0 ? (
          <div className="col-span-full text-center text-neutral-600">
            No hay productos disponibles
          </div>
        ) : (
          products.map((p: Product, index: number) => {
            const stock = Number(p.stock ?? 0);
            const isInactive = !p.isActive;
            const isAvailable = !isInactive && stock > 0;
            const stockLabel = isInactive
              ? "No disponible"
              : stock > 0
                ? `${stock} ${stock === 1 ? "disponible" : "disponibles"}`
                : "Agotado";
            const stockTone = isInactive
              ? "border-[var(--mistika-border)] bg-[var(--mistika-cream)] text-[var(--mistika-olive)]"
              : isAvailable
                ? "border-emerald-200/70 bg-emerald-50/80 text-emerald-700"
                : "border-amber-200/70 bg-amber-50/80 text-amber-800";
            const stockDot = isInactive
              ? "bg-neutral-400"
              : isAvailable
                ? "bg-emerald-500"
                : "bg-amber-500";

            return (
              <Link
                key={p.id}
                href={`/shop/${p.id}`}
                className="group relative overflow-hidden rounded-[28px] border bg-[var(--mistika-paper)] p-4 text-[var(--mistika-ink)] transition-shadow duration-500 card-reveal"
                style={{
                  borderColor: "var(--mistika-border)",
                  boxShadow: "var(--mistika-shadow)",
                  animationDelay: `${index * 70}ms`,
                }}
              >
                <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[var(--mistika-copper)] opacity-20 blur-2xl transition-transform duration-700 group-hover:translate-y-3" />

                <div className="relative overflow-hidden rounded-[22px] bg-[var(--mistika-cream)]">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-90"
                    style={{
                      background:
                        "radial-gradient(120% 80% at 20% 10%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.15) 45%, transparent 70%), linear-gradient(145deg, rgba(255,255,255,0.14), rgba(0,0,0,0.06))",
                    }}
                  />

                  <div className="relative aspect-[4/5]">
                    <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2">
                      <span className="max-w-[150px] truncate rounded-full border border-[var(--mistika-border)] bg-[var(--mistika-cream)]/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--mistika-ink)] backdrop-blur-sm">
                        {p.category}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${stockTone}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${stockDot}`} />
                        {stockLabel}
                      </span>
                    </div>

                    <div className="absolute right-3 top-3 z-10">
                      <AddToCartIconButton
                        id={p.id}
                        name={p.name}
                        price={p.price?.toString() ?? 0}
                        imageUrl={p.imageUrl ?? null}
                      />
                    </div>

                    <div className="absolute inset-0">
                      <div
                        className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.05]"
                        style={{
                          backgroundImage: `url(${p.imageUrl ?? "/images/products/placeholder.jpg"})`,
                        }}
                      />
                    </div>

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 via-black/0 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  </div>
                </div>

                <div className="mt-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold tracking-[0.04em]">
                      {p.name}
                    </h2>
                    {p.description ? (
                      <p className="mt-1 text-sm text-[var(--mistika-olive)] line-clamp-2">
                        {p.description}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-[var(--mistika-olive)]">
                        Sin descripción por el momento.
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--mistika-olive)]">
                      MXN
                    </p>
                    <p className="text-2xl font-semibold">
                      {p.price?.toString() ?? "—"}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </main>
  );
}
