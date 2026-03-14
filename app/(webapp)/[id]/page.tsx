import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProductPage } from "@/views/product/ProductPage";

export const metadata: Metadata = {
  title: "Producto",
  description: "Detalle del producto.",
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    token?: string | string[];
    expires?: string | string[];
  }>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const token = Array.isArray(resolvedSearchParams.token)
    ? resolvedSearchParams.token[0]
    : resolvedSearchParams.token;
  const expires = Array.isArray(resolvedSearchParams.expires)
    ? resolvedSearchParams.expires[0]
    : resolvedSearchParams.expires;

  if (token && expires) {
    redirect(
      `/orders/details/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}&expires=${encodeURIComponent(expires)}`,
    );
  }

  return <ProductPage />;
}
