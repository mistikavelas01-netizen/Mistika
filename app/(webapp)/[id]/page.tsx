import type { Metadata } from "next";
import { ProductPage } from "@/views/product/ProductPage";

export const metadata: Metadata = {
  title: "Producto",
  description: "Detalle del producto.",
};

export default function Page() {
  return <ProductPage />;
}
