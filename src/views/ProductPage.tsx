"use client";

import Link from "next/link";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { useFetchProductQuery } from "@/store/features/products/productsApi";
import { useParams } from "next/navigation";

export function ProductPage() {

  const params = useParams();
  const id = params.id as string || "";

  const { data: productData, isLoading: isLoadingProduct } = useFetchProductQuery(id, { skip: !id });
  const product: Product = productData?.data || {};

  if (isLoadingProduct) {
    return <div>Cargando...</div>;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/shop" className="text-sm text-neutral-600 hover:underline">
        ← Volver
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-3xl bg-neutral-100">
          <div
            className="h-full w-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${product.imageUrl ?? "/images/placeholder.jpg"})`,
            }}
          />
        </div>

        <div>
          <h1 className="text-3xl font-semibold">{product.name}</h1>

          {product.description ? (
            <p className="mt-2 text-neutral-600">{product.description}</p>
          ) : (
            <p className="mt-2 text-neutral-600">Sin descripción por el momento.</p>
          )}

          <p className="mt-6 text-2xl font-medium">
            ${product.price?.toString() ?? "—"} MXN
          </p>

          <AddToCartButton
            id={product.id}
            name={product.name}
            price={product.price?.toString() ?? 0}
            imageUrl={product.imageUrl ?? null}
          />
        </div>
      </div>
    </main>
  );
}
