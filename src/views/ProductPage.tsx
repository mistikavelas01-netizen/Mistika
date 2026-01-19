"use client";

import Link from "next/link";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { useFetchProductQuery } from "@/store/features/products/productsApi";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/store/features/api/getApiErrorMessage";
import { ArrowLeft } from "lucide-react";

export function ProductPage() {
  const params = useParams();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam ?? "";

  const { data: productData, isLoading: isLoadingProduct, isError: isErrorProduct, error: errorProduct } = useFetchProductQuery(id, { skip: !id });
  const product = productData?.data;
  const errorMessage = getApiErrorMessage(errorProduct);

  useEffect(() => {
    if (isErrorProduct && errorMessage) {
      toast.error(errorMessage);
    }
  }, [isErrorProduct, errorMessage]);

  if (!id) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-neutral-600">Producto inválido.</p>
      </main>
    );
  }

  if (isLoadingProduct) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-neutral-600">Cargando producto...</p>
      </main>
    );
  }

  if (isErrorProduct) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-neutral-600">
          {errorMessage ?? "No se pudo cargar el producto."}
        </p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-neutral-600">Producto no encontrado.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:underline"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Volver</span>
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
